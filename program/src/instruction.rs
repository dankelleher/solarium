//! Program instructions

use crate::state::{
    get_notifications_account_address_with_seed, EncryptedKeyData, Kid, NotificationType,
    UserPubKey,
};
use {
    crate::{
        id,
        state::{
            get_cek_account_address_with_seed, get_userdetails_account_address_with_seed, Message,
        },
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        system_program, sysvar,
    },
};

/// Instructions supported by the program
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum SolariumInstruction {
    /// Create a new channel
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[writable]` Unallocated channel account, must be a program address
    /// 2. `[]` Creator DID account - must be owned by the sol-did program
    /// 3. `[signer]` Creator authority - must be a key on the creator DID
    /// 4. `[writeable]` Unallocated creator CEK account, must be a program address
    /// 5. `[]` Rent sysvar
    /// 6. `[]` System program
    InitializeChannel {
        // /// Size of the channel
        // size: u8,
        /// The channel name
        name: String,

        /// The encrypted CEK signed by the invitee's user key
        cek: EncryptedKeyData,
    },

    /// Create a new direct channel with two participants
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[writable]` Unallocated channel account, must be a program address, derived from the participants' DIDs
    /// 2. `[]` Creator DID account - must be owned by the sol-did program
    /// 3. `[signer]` Creator authority - must be a key on the creator DID
    /// 4. `[writeable]` Unallocated creator CEK account, must be a program address
    /// 5. `[]` Invitee DID account - must be owned by the sol-did program
    /// 6. `[writeable]` Unallocated invitee CEK account, must be a program address
    /// 7. `[]` Rent sysvar
    /// 8. `[]` System program
    InitializeDirectChannel {
        /// The encrypted CEK signed by the creator's user key
        creator_cek: EncryptedKeyData,

        /// The encrypted CEK signed by the invitee's user key
        invitee_cek: EncryptedKeyData,
    },

    /// Post a message to the provided channel account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]` Channel account, must be previously initialized
    /// 1. `[]` Sender DID account
    /// 2. `[signer]` Sender signer account (must be an authority on the sender DID)
    /// 3. `[]` Sender CEK account for this channel (proves permissions to write to this channel)
    Post {
        /// The encrypted message content
        message: String,
    },

    /// Create a new CEK Account for a DID and a channel
    ///
    /// Creating a CEK account is equivalent to adding the DID to the channel.
    /// Only an existing member of a channel can add someone to the channel.
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[]` Invitee DID account - must be owned by the sol-did program
    /// 2. `[]` Inviter DID account - must be owned by the sol-did program
    /// 3. `[signer]` Inviter authority - must be a key on the inviter DID
    /// 4. `[]` Inviter CEK account, this ensures the inviter has permissions to add new users
    /// 5. `[writable]` Unallocated CEK account, must be a program address
    /// 6. `[]` Channel account, must be previously initialized
    /// 7. `[]` Rent sysvar
    /// 8. `[]` System program
    AddToChannel {
        /// The encrypted channel CEK, signed by the invitee's user key
        cek: EncryptedKeyData,
    },

    /// Add an encrypted user key to an existing UserDetails account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[]` Owner DID account - must be owned by the sol-did program
    /// 1. `[signer]` Owner authority - must be a key on the owner DID
    /// 2. `[writable]` UserDetails account, must be owned by the owner DID
    AddEncryptedUserKey {
        /// A new key to add to the account
        key_data: EncryptedKeyData,
    },

    /// Remove a key from an existing UserDetails account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[]` Owner DID account - must be owned by the sol-did program
    /// 1. `[signer]` Owner authority - must be a key on the owner DID
    /// 2. `[writable]` UserDetails account, must be owned by the owner DID
    RemoveEncryptedUserKey {
        /// The key id of the encrypted key to remove
        kid: Kid,
    },

    /// Creates a UserDetails account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[]` Owner DID account - must be owned by the sol-did program
    /// 2. `[signer]` Owner authority - must be a key on the owner DID
    /// 3. `[writable]` UserDetails account, must be owned by the owner DID
    /// 4. `[]` Rent sysvar
    /// 5. `[]` System program
    CreateUserDetails {
        /// The user's public alias
        alias: String,
        /// The user's encrypted address book
        address_book: String,
        /// The public part of the user key
        user_pub_key: UserPubKey,
        /// The user private key, encrypted for each key in their DID at time of creation
        encrypted_user_private_key_data: Vec<EncryptedKeyData>,
        /// The size of the userDetails account
        size: u32,
    },

    /// Updates a UserDetails account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[]` Owner DID account - must be owned by the sol-did program
    /// 1. `[signer]` Owner authority - must be a key on the owner DID
    /// 2. `[writable]` UserDetails account, must be owned by the owner DID
    UpdateUserDetails {
        /// The user's new public alias
        alias: String,
        /// The user's encrypted address book
        address_book: String,
    },

    /// Creates a Notifications account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[]` Owner DID account - must be owned by the sol-did program
    /// 2. `[signer]` Owner authority - must be a key on the owner DID
    /// 3. `[writable]` Notifications account, must be owned by the owner DID
    /// 4. `[]` Rent sysvar
    /// 5. `[]` System program
    CreateNotifications {
        /// The size of the notifications cache
        size: u8,
    },

    /// Add a notification for a user
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]` Notifications account, must be previously initialized
    AddNotification {
        /// The notification type
        notification_type: NotificationType,
        /// The public key relating to the notification.
        /// The key should be interpreted in relation to the notification type.
        pubkey: Pubkey,
    },
}

/// Create a `SolariumInstruction::InitializeChannel` instruction
pub fn initialize_channel(
    funder_account: &Pubkey,
    channel: &Pubkey,
    name: String,
    creator_did: &Pubkey,
    creator_authority: &Pubkey,
    cek: EncryptedKeyData,
) -> Instruction {
    let (creator_cek_account, _) = get_cek_account_address_with_seed(&id(), creator_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::InitializeChannel { name, cek },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(*channel, false),
            AccountMeta::new_readonly(*creator_did, false),
            AccountMeta::new_readonly(*creator_authority, true),
            AccountMeta::new(creator_cek_account, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `SolariumInstruction::InitializeChannel` instruction
pub fn initialize_direct_channel(
    funder_account: &Pubkey,
    channel: &Pubkey,
    creator_did: &Pubkey,
    creator_authority: &Pubkey,
    invitee_did: &Pubkey,
    creator_cek: EncryptedKeyData,
    invitee_cek: EncryptedKeyData,
) -> Instruction {
    let (creator_cek_account, _) = get_cek_account_address_with_seed(&id(), creator_did, channel);
    let (invitee_cek_account, _) = get_cek_account_address_with_seed(&id(), invitee_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::InitializeDirectChannel {
            creator_cek,
            invitee_cek,
        },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(*channel, false),
            AccountMeta::new_readonly(*creator_did, false),
            AccountMeta::new_readonly(*creator_authority, true),
            AccountMeta::new(creator_cek_account, false),
            AccountMeta::new_readonly(*invitee_did, false),
            AccountMeta::new(invitee_cek_account, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `SolariumInstruction::Post` instruction
pub fn post(channel: &Pubkey, sender_authority: &Pubkey, message: &Message) -> Instruction {
    let (sender_cek_account, _) =
        get_cek_account_address_with_seed(&id(), &message.sender, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::Post {
            message: message.content.to_string(),
        },
        vec![
            AccountMeta::new(*channel, false),
            AccountMeta::new_readonly(message.sender, false),
            AccountMeta::new_readonly(*sender_authority, true),
            AccountMeta::new_readonly(sender_cek_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::AddToChannel` instruction
pub fn add_to_channel(
    funder_account: &Pubkey,
    channel: &Pubkey,
    invitee_did: &Pubkey,
    inviter_did: &Pubkey,
    inviter_authority: &Pubkey,
    cek: EncryptedKeyData,
) -> Instruction {
    let (inviter_cek_account, _) = get_cek_account_address_with_seed(&id(), inviter_did, channel);
    let (invitee_cek_account, _) = get_cek_account_address_with_seed(&id(), invitee_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::AddToChannel { cek },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new_readonly(*invitee_did, false),
            AccountMeta::new_readonly(*inviter_did, false),
            AccountMeta::new_readonly(*inviter_authority, true),
            AccountMeta::new_readonly(inviter_cek_account, false),
            AccountMeta::new(invitee_cek_account, false),
            AccountMeta::new_readonly(*channel, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `SolariumInstruction::AddEncryptedUserKey` instruction
pub fn add_encrypted_user_key(
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    key_data: EncryptedKeyData,
) -> Instruction {
    let (owner_user_details_account, _) =
        get_userdetails_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::AddEncryptedUserKey { key_data },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_user_details_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::RemoveEncryptedUserKey` instruction
pub fn remove_encrypted_user_key(
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    kid: Kid,
) -> Instruction {
    let (owner_user_details_account, _) =
        get_userdetails_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::RemoveEncryptedUserKey { kid },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_user_details_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::CreateUserDetails` instruction
pub fn create_user_details(
    funder_account: &Pubkey,
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    alias: String,
    size: u32,
    user_pub_key: UserPubKey,
    encrypted_user_private_key_data: Vec<EncryptedKeyData>,
) -> Instruction {
    let (owner_userdetails_account, _) =
        get_userdetails_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::CreateUserDetails {
            alias,
            address_book: "".to_string(),
            user_pub_key,
            encrypted_user_private_key_data,
            size,
        },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_userdetails_account, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `SolariumInstruction::UpdateUserDetails` instruction
pub fn update_user_details(
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    alias: String,
    address_book: String,
) -> Instruction {
    let (owner_userdetails_account, _) =
        get_userdetails_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::UpdateUserDetails {
            alias,
            address_book,
        },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_userdetails_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::CreateNotifications` instruction
pub fn create_notifications(
    funder_account: &Pubkey,
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    size: u8,
) -> Instruction {
    let (owner_notifications_account, _) =
        get_notifications_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::CreateNotifications { size },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_notifications_account, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `SolariumInstruction::AddNotification` instruction
pub fn add_notification(
    notification_type: NotificationType,
    pubkey: &Pubkey,
    owner_did: &Pubkey,
    sender_did: &Pubkey,
    sender_authority: &Pubkey,
) -> Instruction {
    let (owner_notifications_account, _) =
        get_notifications_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::AddNotification {
            pubkey: *pubkey,
            notification_type,
        },
        vec![
            AccountMeta::new(owner_notifications_account, false),
            AccountMeta::new_readonly(*sender_did, false),
            AccountMeta::new_readonly(*sender_authority, true),
        ],
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::program_error::ProgramError;

    #[test]
    fn deserialize_invalid_instruction() {
        let expected = vec![12];
        let err: ProgramError = SolariumInstruction::try_from_slice(&expected)
            .unwrap_err()
            .into();
        assert!(matches!(err, ProgramError::BorshIoError(_)));
    }
}
