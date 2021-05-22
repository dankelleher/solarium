//! Program state processor

use {
    crate::{
        borsh as program_borsh,
        error::SolariumError,
        id,
        instruction::SolariumInstruction,
        state::{get_cek_account_address_with_seed, CEKAccountData, CEKData, ChannelData, Message, CEK_ACCOUNT_ADDRESS_SEED},
    },
    borsh::{BorshDeserialize, BorshSerialize},
    sol_did::{validate_owner},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::invoke_signed,
        program_error::ProgramError,
        program_pack::IsInitialized,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction,
        sysvar::Sysvar
    }
};

/// Checks that the authority_info account is an authority for the DID,
/// And that the CEK Account is owned by that DID
fn check_authority_of_cek(authority_info: &AccountInfo, did: &AccountInfo, cek_account_info: &AccountInfo) -> ProgramResult {
    check_authority_of_did(authority_info, did).unwrap();

    let cek_account =
        program_borsh::try_from_slice_incomplete::<CEKAccountData>(*cek_account_info.data.borrow())?;
    if !(cek_account.owner_did.eq(did.key)) {
        msg!("Incorrect CEKAccount authority provided");
        return Err(SolariumError::IncorrectAuthority.into())
    }

    if *cek_account_info.owner != id() {
        msg!("Error: cek account is not a Solarium program account");
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}

fn check_authority_of_did(authority_info: &AccountInfo, did: &AccountInfo) -> ProgramResult {
    if !authority_info.is_signer {
        msg!("CEKAccount authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    validate_owner(did, &[authority_info])
}

/// Checks that the cek account belongs to the channel, and that it is owned by this program
fn check_cek_account(cek_account_info: &AccountInfo, channel_info: &AccountInfo) -> ProgramResult {
    if *channel_info.owner != id() {
        msg!("Error: channel is not a Solarium program account");
        return Err(ProgramError::IncorrectProgramId);
    }

    let cek_account =
        program_borsh::try_from_slice_incomplete::<CEKAccountData>(*cek_account_info.data.borrow())?;
    if cek_account.channel != *channel_info.key {
        msg!("Error: cek account is not for the correct channel");
        return Err(SolariumError::CEKIncorrectChannel.into());
    }
    
    Ok(())
}

fn initialize_channel(accounts: &[AccountInfo], name: String, initial_ceks: Vec<CEKData>) -> ProgramResult {
    msg!("SolariumInstruction::InitializeChannel");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let channel_account_info = next_account_info(account_info_iter)?;
    let creator_did_info = next_account_info(account_info_iter)?;
    let creator_authority_info = next_account_info(account_info_iter)?;
    let creator_cek_account_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let rent = &Rent::from_account_info(rent_info)?;

    let channel =
        program_borsh::try_from_slice_incomplete::<ChannelData>(*channel_account_info.data.borrow())?;
    if channel.is_initialized() {
        msg!("Error: Attempt to create a channel for an address that is already in use");
        return Err(SolariumError::AlreadyInUse.into());
    }

    // Check that the authority is valid for the DID 
    check_authority_of_did(creator_authority_info, creator_did_info).unwrap();

    create_cek_account(
        initial_ceks,
        funder_info.clone(), 
        creator_did_info, 
        creator_cek_account_info.clone(), 
        channel_account_info, 
        system_program_info.clone(), 
        rent).unwrap();

    msg!("CEK Account created for new channel");
    
    let channel = ChannelData::new(name);

    msg!("Channel created");

    channel.serialize(&mut *channel_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn post(accounts: &[AccountInfo], message: String) -> ProgramResult {
    msg!("SolariumInstruction::Post");
    let account_info_iter = &mut accounts.iter();
    let channel_account_info = next_account_info(account_info_iter)?;
    let sender_did_info = next_account_info(account_info_iter)?;
    let sender_authority_info = next_account_info(account_info_iter)?;
    let sender_cek_account_info = next_account_info(account_info_iter)?;
    let mut channel =
        program_borsh::try_from_slice_incomplete::<ChannelData>(*channel_account_info.data.borrow())?;
    
    if !channel.is_initialized() {
        msg!("Channel account not initialized");
        return Err(ProgramError::UninitializedAccount);
    }

    // Check that the sender of the message is valid
    // the sender signer is an authority on the DID.
    validate_owner(sender_did_info, &[sender_authority_info]).unwrap();

    // check that the sender is allowed to post to this channel
    check_authority_of_cek(sender_authority_info, sender_did_info, &sender_cek_account_info).unwrap();

    let message_info = Message::new(*sender_did_info.key, message);

    channel.post(message_info);

    channel.serialize(&mut *channel_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn add_to_channel(accounts: &[AccountInfo], initial_ceks: Vec<CEKData>) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let invitee_did_info = next_account_info(account_info_iter)?;
    let inviter_did_info = next_account_info(account_info_iter)?;
    let inviter_authority_info = next_account_info(account_info_iter)?;
    let inviter_cek_account_info = next_account_info(account_info_iter)?;
    let invitee_cek_account_info = next_account_info(account_info_iter)?;
    let channel_account_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let rent = &Rent::from_account_info(rent_info)?;
    
    // Check that the inviter has permissions to invite to this channel
    check_cek_account(inviter_cek_account_info, channel_account_info).unwrap();

    // Check that the inviter signer is valid for the DID 
    // and that the inviter DID owns the inviter CEK account 
    check_authority_of_cek(inviter_authority_info, inviter_did_info, inviter_cek_account_info).unwrap();

    create_cek_account(
        initial_ceks,
        funder_info.clone(),
        invitee_did_info, 
        invitee_cek_account_info.clone(), 
        channel_account_info,
        system_program_info.clone(),
        rent
    )
}

fn create_cek_account<'a>(
    initial_ceks: Vec<CEKData>,
    funder_info: AccountInfo<'a>,
    invitee_did_info: &AccountInfo,
    invitee_cek_account_info: AccountInfo<'a>,
    channel_account_info: &AccountInfo,
    system_program_info: AccountInfo<'a>,
    rent:&Rent) -> ProgramResult {
    let (cek_account_address, cek_account_bump_seed) = get_cek_account_address_with_seed(invitee_did_info.key, channel_account_info.key);

    // Check that we are not overwriting an existing cek account 
    let data_len = invitee_cek_account_info.data.borrow().len();
    if data_len > 0 {
        msg!("CEK account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    // Check that the new cek account address has been derived correctly
    // for the invitee and channel
    if cek_account_address != *invitee_cek_account_info.key {
        msg!("Error: cek account address derivation mismatch");
        return Err(SolariumError::AddressDerivationMismatch.into());
    }

    // Create the new cek account for the invitee
    let mut cek_account = CEKAccountData::new(*invitee_did_info.key, *channel_account_info.key);
    cek_account.add_all(initial_ceks);
    let size = program_borsh::get_instance_packed_len(&cek_account).unwrap() as u64;
    let cek_account_signer_seeds: &[&[_]] =
        &[&invitee_did_info.key.to_bytes(), &channel_account_info.key.to_bytes(), CEK_ACCOUNT_ADDRESS_SEED, &[cek_account_bump_seed]];

    msg!("Creating CEK account with size {}", size);
    msg!("invitee did info {}", invitee_did_info.key);
    msg!("invitee cek info {}", invitee_cek_account_info.key);
    msg!("funder info {}", funder_info.key);
    msg!("channel info {}", channel_account_info.key);
    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            invitee_cek_account_info.key,
            1.max(rent.minimum_balance(size as usize)),
            size,
            &id(),
        ),
        &[
            funder_info.clone(),
            invitee_cek_account_info.clone(),
            system_program_info.clone(),
        ],
        &[&cek_account_signer_seeds],
    )?;
    
    msg!("CEK Account Created");

    cek_account.serialize(&mut *invitee_cek_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn add_cek(accounts: &[AccountInfo], cek: CEKData) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let did_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let cek_account_info = next_account_info(account_info_iter)?;
    
    // Check that the authority is valid for the DID 
    // and that the DID owns the CEK account 
    check_authority_of_cek(authority_info, did_info, cek_account_info).unwrap();

    let mut cek_account =
        program_borsh::try_from_slice_incomplete::<CEKAccountData>(*cek_account_info.data.borrow())?;
    
    cek_account.add(cek);

    cek_account.serialize(&mut *cek_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn remove_cek(accounts: &[AccountInfo], kid: String) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let did_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let cek_account_info = next_account_info(account_info_iter)?;

    // Check that the authority is valid for the DID 
    // and that the DID owns the CEK account 
    check_authority_of_cek(authority_info, did_info, cek_account_info).unwrap();

    let mut cek_account =
        program_borsh::try_from_slice_incomplete::<CEKAccountData>(*cek_account_info.data.borrow())?;

    cek_account.remove(kid).unwrap();

    cek_account.serialize(&mut *cek_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = SolariumInstruction::try_from_slice(input)?;

    match instruction {
        SolariumInstruction::InitializeChannel { name, initial_ceks} => {
            let res = initialize_channel(accounts, name, initial_ceks);
            msg!("InitializeChannel complete: {:#?}", res);
            res
        },
        SolariumInstruction::Post { message } => post(accounts, message),
        SolariumInstruction::AddToChannel { initial_ceks } => add_to_channel(accounts, initial_ceks),
        SolariumInstruction::AddCEK { cek } => add_cek(accounts, cek),
        SolariumInstruction::RemoveCEK { kid} => remove_cek(accounts, kid),
    }
}
