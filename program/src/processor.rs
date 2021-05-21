//! Program state processor

use {
    crate::{
        borsh as program_borsh,
        error::SolariumError,
        id,
        instruction::SolariumInstruction,
        state::{get_inbox_address_with_seed, InboxData},
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
use crate::state::{ADDRESS_SEED, Message, CEKAccountData, CEKData, ChannelData};
use crate::borsh::try_from_slice_incomplete;

/// Checks that the authority_info account is an authority for the DID,
/// And that the CEK Account is owned by that DID
fn check_authority(authority_info: &AccountInfo, did: &AccountInfo, cekAccount: &CEKAccountData) -> ProgramResult {
    if !authority_info.is_signer {
        msg!("CEKAccount authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if !(cekAccount.owner.eq(did.key)) {
        msg!("Incorrect CEKAccount authority provided");
        return Err(SolariumError::IncorrectAuthority.into())
    }

    validate_owner(did, &[authority_info])
}

fn initialize_channel(accounts: &[AccountInfo], name: String) -> ProgramResult {
    msg!("SolariumInstruction::InitializeChannel");
    let account_info_iter = &mut accounts.iter();
    let channel_account = next_account_info(account_info_iter)?;

    let channel = try_from_slice_incomplete::<ChannelData>(*channel_account.data.borrow())?;
    if channel.is_initialized() {
        msg!("Error: Attempt to create a channel for an address that is already in use");
        return Err(SolariumError::AlreadyInUse.into());
    }

    if channel_account.owner != id() {
        msg!("Error: channel account owner is not the Solarium program");
        return Err(ProgramError::IncorrectProgramId);
    }

    let channel = ChannelData::new(name);

    channel.serialize(&mut *channel_account.data.borrow_mut())
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
    let mut sender_cek_account =
        program_borsh::try_from_slice_incomplete::<CEKAccountData>(*sender_cek_account_info.data.borrow())?;
    check_authority(sender_authority_info, sender_did_info, &sender_cek_account);

    let message_info = Message::new(*sender_did_info.key, message);

    channel.post(message_info);

    channel.serialize(&mut *channel_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn add_to_channel(accounts: &[AccountInfo], initial_ceks: Vec<CEKData>) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    Ok(())
}

fn add_cek(accounts: &[AccountInfo], cek: CEKData) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    Ok(())
}

fn remove_cek(accounts: &[AccountInfo], kid: String) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    Ok(())
}

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = SolariumInstruction::try_from_slice(input)?;

    match instruction {
        SolariumInstruction::InitializeChannel { name} => initialize_channel(accounts, name),
        SolariumInstruction::Post { message } => post(accounts, message),
        SolariumInstruction::AddToChannel { initial_ceks } => add_to_channel(accounts, initial_ceks),
        SolariumInstruction::AddCEK { cek } => add_cek(accounts, cek),
        SolariumInstruction::RemoveCEK { kid} => remove_cek(accounts, kid),
    }
}
