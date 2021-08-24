//! Program state processor

use crate::state::{direct_channel_address_order, get_notifications_account_address_with_seed, get_userdetails_account_address_with_seed, Notification, NotificationType, Notifications, UserDetails, CHANNEL_ADDRESS_SEED, NOTIFICATIONS_ACCOUNT_ADDRESS_SEED, USERDETAILS_ACCOUNT_ADDRESS_SEED, EncryptedKeyData, CEKAccountDataV2, UserPubKey, Kid};
use {
    crate::{
        borsh as program_borsh,
        error::SolariumError,
        instruction::SolariumInstruction,
        state::{
            get_cek_account_address_with_seed, get_channel_address_with_seed, CEKAccountDataV1,
            ChannelData, Message, CEK_ACCOUNT_ADDRESS_SEED,
        },
    },
    borsh::{BorshDeserialize, BorshSerialize},
    sol_did::validate_owner,
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
        sysvar::Sysvar,
    },
};
use core::mem;

/// Checks that the authority_info account is an authority for the DID,
/// And that the CEK Account is owned by that DID
fn check_authority_of_cek(
    program_id: &Pubkey,
    authority_info: &AccountInfo,
    did: &AccountInfo,
    cek_account_info: &AccountInfo,
) -> ProgramResult {
    check_authority_of_did(authority_info, did).unwrap();

    let cek_account = program_borsh::try_from_slice_incomplete::<CEKAccountDataV1>(
        *cek_account_info.data.borrow(),
    )?;
    if !(cek_account.owner_did.eq(did.key)) {
        msg!("Incorrect CEKAccount authority provided");
        return Err(SolariumError::IncorrectAuthority.into());
    }

    if cek_account_info.owner != program_id {
        msg!("Error: cek account is not a Solarium program account");
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}

/// Checks that the authority_info account is an authority for the DID,
/// And that the user details Account is owned by that DID
fn check_authority_of_user_details(
    program_id: &Pubkey,
    authority_info: &AccountInfo,
    did: &AccountInfo,
    user_details_account_info: &AccountInfo,
) -> ProgramResult {
    check_authority_of_did(authority_info, did).unwrap();

    if user_details_account_info.owner != program_id {
        msg!("Error: user details account is not a Solarium program account");
        return Err(ProgramError::IncorrectProgramId);
    }

    // check that the user details account belongs to the DID
    let (user_details_address, _) =
        get_userdetails_account_address_with_seed(program_id, did.key);
    if user_details_address != *user_details_account_info.key {
        msg!("Error: Attempt to update a userdetails account with an address not derived from the DID");
        return Err(SolariumError::AddressDerivationMismatch.into());
    }

    Ok(())
}

fn check_authority_of_did(authority_info: &AccountInfo, did: &AccountInfo) -> ProgramResult {
    msg!("Checking authority of DID");
    if !authority_info.is_signer {
        msg!("CEKAccount authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    validate_owner(did, &[authority_info])
}

/// Checks that the cek account belongs to the channel, and that it is owned by this program
fn check_cek_account(
    program_id: &Pubkey,
    cek_account_info: &AccountInfo,
    channel_info: &AccountInfo,
) -> ProgramResult {
    if channel_info.owner != program_id {
        msg!("Error: channel is not a Solarium program account");
        return Err(ProgramError::IncorrectProgramId);
    }

    let cek_account = program_borsh::try_from_slice_incomplete::<CEKAccountDataV1>(
        *cek_account_info.data.borrow(),
    )?;
    if cek_account.channel != *channel_info.key {
        msg!("Error: cek account is not for the correct channel");
        return Err(SolariumError::CEKIncorrectChannel.into());
    }

    Ok(())
}

fn initialize_channel(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    name: String,
    cek: EncryptedKeyData,
) -> ProgramResult {
    msg!("SolariumInstruction::InitializeChannel");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let channel_info = next_account_info(account_info_iter)?;
    let creator_did_info = next_account_info(account_info_iter)?;
    let creator_authority_info = next_account_info(account_info_iter)?;
    let creator_cek_account_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let rent = &Rent::from_account_info(rent_info)?;

    if channel_info.owner != program_id {
        msg!("Error: channel is not a Solarium program account");
        return Err(ProgramError::IncorrectProgramId);
    }

    let channel =
        program_borsh::try_from_slice_incomplete::<ChannelData>(*channel_info.data.borrow())?;
    if channel.is_initialized() {
        msg!("Error: Attempt to create a channel for an address that is already in use");
        return Err(SolariumError::AlreadyInUse.into());
    }

    // Check that the authority is valid for the DID
    check_authority_of_did(creator_authority_info, creator_did_info).unwrap();

    create_cek_account(
        program_id,
        cek,
        funder_info.clone(),
        creator_did_info,
        creator_cek_account_info.clone(),
        channel_info,
        system_program_info.clone(),
        rent,
    )
    .unwrap();

    let channel = ChannelData::new(name);

    channel
        .serialize(&mut *channel_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn initialize_direct_channel(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    creator_cek: EncryptedKeyData,
    invitee_cek: EncryptedKeyData,
) -> ProgramResult {
    msg!("SolariumInstruction::InitializeDirectChannel");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let channel_info = next_account_info(account_info_iter)?;
    let creator_did_info = next_account_info(account_info_iter)?;
    let creator_authority_info = next_account_info(account_info_iter)?;
    let creator_cek_account_info = next_account_info(account_info_iter)?;
    let invitee_did_info = next_account_info(account_info_iter)?;
    let invitee_cek_account_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let rent = &Rent::from_account_info(rent_info)?;

    msg!("Checking channel address");
    let (channel_address, channel_bump_seed) =
        get_channel_address_with_seed(program_id, creator_did_info.key, invitee_did_info.key);
    // Check that the new direct channel address has been derived correctly
    // for the creator and invitee
    if channel_address != *channel_info.key {
        msg!("Error: channel address derivation mismatch");
        return Err(SolariumError::AddressDerivationMismatch.into());
    }

    msg!("Checking channel initialized");
    let data_len = channel_info.data.borrow().len();
    if data_len > 0 {
        msg!("Error: Attempt to create a channel for an address that is already in use");
        return Err(SolariumError::AlreadyInUse.into());
    }

    msg!("Checking creator authority");
    // Check that the authority is valid for the DID
    check_authority_of_did(creator_authority_info, creator_did_info).unwrap();

    msg!("Creating creator cek account");
    create_cek_account(
        program_id,
        creator_cek,
        funder_info.clone(),
        creator_did_info,
        creator_cek_account_info.clone(),
        channel_info,
        system_program_info.clone(),
        rent,
    )
    .unwrap();

    msg!("Creating invitee cek account");
    create_cek_account(
        program_id,
        invitee_cek,
        funder_info.clone(),
        invitee_did_info,
        invitee_cek_account_info.clone(),
        channel_info,
        system_program_info.clone(),
        rent,
    )
    .unwrap();

    msg!("Creating channel");

    let size = ChannelData::size_bytes();
    let did_seeds = direct_channel_address_order(creator_did_info.key, invitee_did_info.key);
    let channel_signer_seeds: &[&[_]] = &[
        &did_seeds[0].to_bytes(),
        &did_seeds[1].to_bytes(),
        CHANNEL_ADDRESS_SEED,
        &[channel_bump_seed],
    ];

    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            channel_info.key,
            1.max(rent.minimum_balance(size as usize)),
            size as u64,
            program_id,
        ),
        &[
            funder_info.clone(),
            channel_info.clone(),
            system_program_info.clone(),
        ],
        &[&channel_signer_seeds],
    )?;

    msg!("Serializing");
    let name = format!(
        "{}/{}",
        creator_did_info.key.to_string(),
        invitee_did_info.key.to_string()
    );
    let channel = ChannelData::new(name);
    channel
        .serialize(&mut *channel_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn post(program_id: &Pubkey, accounts: &[AccountInfo], message: String) -> ProgramResult {
    msg!("SolariumInstruction::Post");
    let account_info_iter = &mut accounts.iter();
    let channel_info = next_account_info(account_info_iter)?;
    let sender_did_info = next_account_info(account_info_iter)?;
    let sender_authority_info = next_account_info(account_info_iter)?;
    let sender_cek_account_info = next_account_info(account_info_iter)?;
    let mut channel =
        program_borsh::try_from_slice_incomplete::<ChannelData>(*channel_info.data.borrow())?;

    if !channel.is_initialized() {
        msg!("Channel account not initialized");
        return Err(ProgramError::UninitializedAccount);
    }

    // Check that the sender of the message is valid
    // the sender signer is an authority on the DID.
    validate_owner(sender_did_info, &[sender_authority_info]).unwrap();

    // check that the sender is allowed to post to this channel
    check_authority_of_cek(
        program_id,
        sender_authority_info,
        sender_did_info,
        &sender_cek_account_info,
    )
    .unwrap();

    let message_info = Message::new(*sender_did_info.key, message);

    channel.post(message_info);

    channel
        .serialize(&mut *channel_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn add_to_channel(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    cek: EncryptedKeyData,
) -> ProgramResult {
    msg!("SolariumInstruction::AddToChannel");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let invitee_did_info = next_account_info(account_info_iter)?;
    let inviter_did_info = next_account_info(account_info_iter)?;
    let inviter_authority_info = next_account_info(account_info_iter)?;
    let inviter_cek_account_info = next_account_info(account_info_iter)?;
    let invitee_cek_account_info = next_account_info(account_info_iter)?;
    let channel_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let rent = &Rent::from_account_info(rent_info)?;

    // Check that the inviter has permissions to invite to this channel
    check_cek_account(program_id, inviter_cek_account_info, channel_info).unwrap();

    // Check that the inviter signer is valid for the DID
    // and that the inviter DID owns the inviter CEK account
    check_authority_of_cek(
        program_id,
        inviter_authority_info,
        inviter_did_info,
        inviter_cek_account_info,
    )
    .unwrap();

    create_cek_account(
        program_id,
        cek,
        funder_info.clone(),
        invitee_did_info,
        invitee_cek_account_info.clone(),
        channel_info,
        system_program_info.clone(),
        rent,
    )
}

#[allow(clippy::too_many_arguments)]
fn create_cek_account<'a>(
    program_id: &Pubkey,
    cek: EncryptedKeyData,
    funder_info: AccountInfo<'a>,
    invitee_did_info: &AccountInfo,
    invitee_cek_account_info: AccountInfo<'a>,
    channel_info: &AccountInfo,
    system_program_info: AccountInfo<'a>,
    rent: &Rent,
) -> ProgramResult {
    let (cek_account_address, cek_account_bump_seed) =
        get_cek_account_address_with_seed(program_id, invitee_did_info.key, channel_info.key);

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
    let cek_account = CEKAccountDataV2::new(*invitee_did_info.key, *channel_info.key, cek);

    let size = mem::size_of::<CEKAccountDataV2>();
    let cek_account_signer_seeds: &[&[_]] = &[
        &invitee_did_info.key.to_bytes(),
        &channel_info.key.to_bytes(),
        CEK_ACCOUNT_ADDRESS_SEED,
        &[cek_account_bump_seed],
    ];

    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            invitee_cek_account_info.key,
            1.max(rent.minimum_balance(size)),
            size as u64,
            program_id,
        ),
        &[
            funder_info.clone(),
            invitee_cek_account_info.clone(),
            system_program_info.clone(),
        ],
        &[&cek_account_signer_seeds],
    )?;

    cek_account
        .serialize(&mut *invitee_cek_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn update_user_details(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    alias: String,
    address_book: String,
) -> ProgramResult {
    msg!("SolariumInstruction::UpdateUserDetails");
    let account_info_iter = &mut accounts.iter();
    let did_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let user_details_account_info = next_account_info(account_info_iter)?;

    // Check that the signer is valid for the DID
    // and that the DID owns the user details account
    check_authority_of_user_details(
        program_id,
        authority_info,
        did_info,
        user_details_account_info,
    ).unwrap();
    
    let mut user_details = program_borsh::try_from_slice_incomplete::<UserDetails>(
        *user_details_account_info.data.borrow(),
    )?;

    if !user_details.is_initialized() {
        msg!("UserDetails account not initialized");
        return Err(ProgramError::UninitializedAccount);
    }

    // mutate the UserDetails object
    user_details.alias = alias;
    user_details.address_book = address_book;

    user_details
        .serialize(&mut *user_details_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn add_encrypted_user_key(program_id: &Pubkey, accounts: &[AccountInfo], key_data: EncryptedKeyData) -> ProgramResult {
    msg!("SolariumInstruction::AddEncryptedUserKey");
    let account_info_iter = &mut accounts.iter();
    let did_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let user_details_account_info = next_account_info(account_info_iter)?;

    // Check that the signer is valid for the DID
    // and that the DID owns the user details account
    check_authority_of_user_details(
        program_id,
        authority_info,
        did_info,
        user_details_account_info,
    ).unwrap();
    
    let mut user_details_account = program_borsh::try_from_slice_incomplete::<UserDetails>(
        *user_details_account_info.data.borrow(),
    )?;

    user_details_account.add_key(key_data);

    msg!("serializing");
    user_details_account
        .serialize(&mut *user_details_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn remove_encrypted_user_key(program_id: &Pubkey, accounts: &[AccountInfo], kid: Kid) -> ProgramResult {
    msg!("SolariumInstruction::Removeuser_details");
    let account_info_iter = &mut accounts.iter();
    let did_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let user_details_account_info = next_account_info(account_info_iter)?;

    // Check that the signer is valid for the DID
    // and that the DID owns the user details account
    check_authority_of_user_details(
        program_id,
        authority_info,
        did_info,
        user_details_account_info,
    ).unwrap();

    let mut user_details_account = program_borsh::try_from_slice_incomplete::<UserDetails>(
        *user_details_account_info.data.borrow(),
    )?;

    user_details_account.remove_key(kid).unwrap();

    user_details_account
        .serialize(&mut *user_details_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn create_user_details(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    alias: String,
    address_book: String,
    user_public_key: UserPubKey,
    encrypted_user_private_key_data: Vec<EncryptedKeyData>,
    size: u32,
) -> ProgramResult {
    msg!("SolariumInstruction::CreateUserDetails");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let did_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let user_details_account_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let rent = &Rent::from_account_info(rent_info)?;

    let data_len = user_details_account_info.data.borrow().len();
    if data_len > 0 {
        msg!(
            "Error: Attempt to create a userdetails account for an address that is already in use"
        );
        return Err(SolariumError::AlreadyInUse.into());
    }

    // Check that the authority is valid for the DID
    check_authority_of_did(authority_info, did_info).unwrap();

    let (user_details_address, user_details_bump_seed) =
        get_userdetails_account_address_with_seed(program_id, did_info.key);
    if user_details_address != *user_details_account_info.key {
        msg!("Error: Attempt to create a userdetails account with an address not derived from the DID");
        return Err(SolariumError::AddressDerivationMismatch.into());
    }

    // Create the new userdetails account for the solarium user
    let new_user_details = UserDetails {
        alias,
        address_book,
        user_public_key,
        encrypted_user_private_key_data
    };

    let user_details_account_signer_seeds: &[&[_]] = &[
        &did_info.key.to_bytes(),
        USERDETAILS_ACCOUNT_ADDRESS_SEED,
        &[user_details_bump_seed],
    ];

    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            user_details_account_info.key,
            1.max(rent.minimum_balance(size as usize)),
            size as u64,
            program_id,
        ),
        &[
            funder_info.clone(),
            user_details_account_info.clone(),
            system_program_info.clone(),
        ],
        &[&user_details_account_signer_seeds],
    )?;

    new_user_details
        .serialize(&mut *user_details_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn create_notifications(program_id: &Pubkey, accounts: &[AccountInfo], size: u8) -> ProgramResult {
    msg!("SolariumInstruction::CreateNotifications");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let did_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let notifications_account_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    let rent = &Rent::from_account_info(rent_info)?;

    let data_len = notifications_account_info.data.borrow().len();
    if data_len > 0 {
        msg!("Error: Attempt to create a notifications account for an address that is already in use");
        return Err(SolariumError::AlreadyInUse.into());
    }

    // Check that the authority is valid for the DID
    check_authority_of_did(authority_info, did_info).unwrap();

    let (notifications_address, notifications_bump_seed) =
        get_notifications_account_address_with_seed(program_id, did_info.key);
    if notifications_address != *notifications_account_info.key {
        msg!("Error: Attempt to create a notifications account with an address not derived from the DID");
        return Err(SolariumError::AddressDerivationMismatch.into());
    }

    // Create the new notifications account
    let new_notifications = Notifications::new(size);
    let notifications_size = new_notifications.size_bytes();

    let notifications_account_signer_seeds: &[&[_]] = &[
        &did_info.key.to_bytes(),
        NOTIFICATIONS_ACCOUNT_ADDRESS_SEED,
        &[notifications_bump_seed],
    ];

    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            notifications_account_info.key,
            1.max(rent.minimum_balance(notifications_size as usize)),
            notifications_size as u64,
            program_id,
        ),
        &[
            funder_info.clone(),
            notifications_account_info.clone(),
            system_program_info.clone(),
        ],
        &[&notifications_account_signer_seeds],
    )?;

    new_notifications
        .serialize(&mut *notifications_account_info.data.borrow_mut())
        .map_err(|e| e.into())
}

fn add_notification(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    notification_type: NotificationType,
    pubkey: &Pubkey,
) -> ProgramResult {
    msg!("SolariumInstruction::AddNotification");
    let account_info_iter = &mut accounts.iter();
    let notifications_info = next_account_info(account_info_iter)?;
    let sender_did_info = next_account_info(account_info_iter)?;
    let sender_authority_info = next_account_info(account_info_iter)?;

    let mut notifications = program_borsh::try_from_slice_incomplete::<Notifications>(
        *notifications_info.data.borrow(),
    )?;
    if !notifications.is_initialized() {
        msg!("Notifications account not initialized");
        return Err(ProgramError::UninitializedAccount);
    }

    if notifications_info.owner != program_id {
        msg!("Error: Notifications account is not a Solarium program account");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Check that the sender of the message is valid
    // the sender signer is an authority on the DID.
    validate_owner(sender_did_info, &[sender_authority_info]).unwrap();

    let notification = Notification {
        notification_type,
        pubkey: *pubkey,
    };
    notifications.add(notification);

    notifications
        .serialize(&mut *notifications_info.data.borrow_mut())
        .map_err(|e| e.into())
}

/// Instruction processor
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = SolariumInstruction::try_from_slice(input)?;

    match instruction {
        SolariumInstruction::InitializeChannel { name, cek } => {
            initialize_channel(program_id, accounts, name, cek)
        }
        SolariumInstruction::InitializeDirectChannel {
            creator_cek,
            invitee_cek,
        } => initialize_direct_channel(program_id, accounts, creator_cek, invitee_cek),
        SolariumInstruction::Post { message } => post(program_id, accounts, message),
        SolariumInstruction::AddToChannel { cek } => add_to_channel(program_id, accounts, cek),
        SolariumInstruction::AddEncryptedUserKey { key_data } => add_encrypted_user_key(program_id, accounts, key_data),
        SolariumInstruction::RemoveEncryptedUserKey { kid } => remove_encrypted_user_key(program_id, accounts, kid),
        SolariumInstruction::CreateUserDetails {
            alias,
            address_book,
            user_pub_key,
            encrypted_user_private_key_data,
            size,
        } => create_user_details(program_id, accounts, alias, address_book, user_pub_key, encrypted_user_private_key_data, size),
        SolariumInstruction::UpdateUserDetails {
            alias,
            address_book,
        } => update_user_details(program_id, accounts, alias, address_book),
        SolariumInstruction::CreateNotifications { size } => {
            create_notifications(program_id, accounts, size)
        }
        SolariumInstruction::AddNotification {
            notification_type,
            pubkey,
        } => add_notification(program_id, accounts, notification_type, &pubkey),
    }
}
