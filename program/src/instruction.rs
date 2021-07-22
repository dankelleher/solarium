//! Program instructions

use {
    crate::{
        id,
        state::{get_cek_account_address_with_seed, get_userdetails_account_address_with_seed, CEKData, Message},
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

        /// The initial set of CEKs that are added to the creator's CEK Account
        /// They should be signed by each key in the creator DID.
        ceks: Vec<CEKData>
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
        /// The initial set of CEKs that are added to the creator's CEK Account
        /// They should be signed by each key in the creator DID.
        creator_ceks: Vec<CEKData>,

        /// The initial set of CEKs that are added to the invited user's CEK Account
        /// They should be signed by each key in the invitee DID.
        invitee_ceks: Vec<CEKData>
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
        /// The initial set of CEKs that are added to the invited user's CEK Account
        /// They should be signed by each key in the DID.
        ceks: Vec<CEKData>,
    },

    /// Add a CEK to an existing CEKAccount 
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[]` Owner DID account - must be owned by the sol-did program
    /// 1. `[signer]` Owner authority - must be a key on the owner DID 
    /// 2. `[writable]` CEK account, must be owned by the owner DID
    AddCEK {
        /// A new CEK to add to the account
        cek: CEKData
    },

    /// Remove a CEK from an existing CEKAccount 
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[]` Owner DID account - must be owned by the sol-did program
    /// 1. `[signer]` Owner authority - must be a key on the owner DID 
    /// 2. `[writable]` CEK account, must be owned by the owner DID
    RemoveCEK {
        /// The key id of the CEK to remove
        kid: String
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
        /// The size of the userDetails account
        size: u32
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
    }
}

/// Create a `SolariumInstruction::InitializeChannel` instruction
pub fn initialize_channel(
    funder_account: &Pubkey,
    channel: &Pubkey,
    name: String,
    creator_did: &Pubkey,
    creator_authority: &Pubkey,
    ceks: Vec<CEKData>
) -> Instruction {
    let (creator_cek_account, _) = get_cek_account_address_with_seed(&id(), creator_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::InitializeChannel { name, ceks },
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
    creator_ceks: Vec<CEKData>,
    invitee_ceks: Vec<CEKData>
) -> Instruction {
    let (creator_cek_account, _) = get_cek_account_address_with_seed(&id(), creator_did, channel);
    let (invitee_cek_account, _) = get_cek_account_address_with_seed(&id(), invitee_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::InitializeDirectChannel {
            creator_ceks,
            invitee_ceks
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
    let (sender_cek_account, _) = get_cek_account_address_with_seed(&id(), &message.sender, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::Post { message: message.content.to_string() },
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
    ceks: Vec<CEKData>
) -> Instruction {
    let (inviter_cek_account, _) = get_cek_account_address_with_seed(&id(), inviter_did, channel);
    let (invitee_cek_account, _) = get_cek_account_address_with_seed(&id(), invitee_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::AddToChannel { ceks },
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

/// Create a `SolariumInstruction::AddCEK` instruction
pub fn add_cek(
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    channel: &Pubkey,
    cek: CEKData
) -> Instruction {
    let (owner_cek_account, _) = get_cek_account_address_with_seed(&id(), owner_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::AddCEK { cek },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_cek_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::RemoveCEK` instruction
pub fn remove_cek(
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    channel: &Pubkey,
    kid: String
) -> Instruction {
    let (owner_cek_account, _) = get_cek_account_address_with_seed(&id(), owner_did, channel);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::RemoveCEK { kid },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_cek_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::CreateUserDetails` instruction
pub fn create_user_details(
    funder_account: &Pubkey,
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    alias: String,
    size: u32
) -> Instruction {
    let (owner_userdetails_account, _) = get_userdetails_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::CreateUserDetails { alias, address_book: "".to_string(), size },
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
    address_book: String
) -> Instruction {
    let (owner_userdetails_account, _) = get_userdetails_account_address_with_seed(&id(), owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::UpdateUserDetails { alias, address_book },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(owner_userdetails_account, false),
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
