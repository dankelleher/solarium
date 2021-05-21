//! Program instructions

use {
    crate::{
        id,
        state::{get_channel_address_with_seed, Message, ChannelData},
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        system_program, sysvar,
    },
};
use crate::state::{CEKData, get_cek_account_address_with_seed};

/// Instructions supported by the program
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum SolariumInstruction {
    /// Create a new channel
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]` Unallocated channel account, must be a program address
    InitializeChannel {
        // /// Size of the channel
        // size: u8,
        /// The channel name
        name: String,
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
        /// The initial set of CEKs that should be used by 
        initial_ceks: Vec<CEKData>
    },

    /// Add a CEK to an existing CEKAccount 
    ///
    /// Accounts expected by this instruction:
    ///
    /// 1. `[]` Owner DID account - must be owned by the sol-did program
    /// 2. `[signer]` Owner authority - must be a key on the owner DID 
    /// 3. `[writable]` CEK account, must be owned by the owner DID
    AddCEK { cek: CEKData },

    /// Remove a CEK from an existing CEKAccount 
    ///
    /// Accounts expected by this instruction:
    ///
    /// 1. `[]` Owner DID account - must be owned by the sol-did program
    /// 2. `[signer]` Owner authority - must be a key on the owner DID 
    /// 3. `[writable]` CEK account, must be owned by the owner DID
    RemoveCEK { kid: String }
}

/// Create a `SolariumInstruction::InitializeChannel` instruction
pub fn initialize_channel(
    channel_account: &Pubkey,
    name: String
) -> Instruction {
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::InitializeChannel { name },
        vec![
            AccountMeta::new(*channel_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::Post` instruction
pub fn post(channel_account: &Pubkey, sender_authority: &Pubkey, sender_cek_account: &Pubkey, message: &Message) -> Instruction {
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::Post { message: message.content.to_string() },
        vec![
            AccountMeta::new(*channel_account, false),
            AccountMeta::new_readonly(message.sender, false),
            AccountMeta::new_readonly(*sender_authority, true),
            AccountMeta::new_readonly(*sender_cek_account, false),
        ],
    )
}

/// Create a `SolariumInstruction::AddToChannel` instruction
pub fn add_to_channel(
    funder_account: &Pubkey,
    channel_account: &Pubkey, 
    invitee_did: &Pubkey,
    inviter_did: &Pubkey,
    inviter_authority: &Pubkey,
    inviter_cek_account: &Pubkey,
    receiver: &Pubkey
) -> Instruction {
    let (invitee_cek_account, _) = get_cek_account_address_with_seed(invitee_did, channel_account);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::AddToChannel {},
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new_readonly(*invitee_did, false),
            AccountMeta::new_readonly(*inviter_did, false),
            AccountMeta::new_readonly(*inviter_authority, true),
            AccountMeta::new_readonly(*inviter_cek_account, false),
            AccountMeta::new(*invitee_cek_account, false),
            AccountMeta::new_readonly(*channel_account, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

pub fn add_cek(
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    channel_account: &Pubkey,
    cek: CEKData
) -> Instruction {
    let (owner_cek_account, _) = get_cek_account_address_with_seed(owner_did, channel_account);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::AddCEK { cek },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(*owner_cek_account, false),
        ],
    )
}

pub fn remove_cek(
    owner_did: &Pubkey,
    owner_authority: &Pubkey,
    channel_account: &Pubkey,
    kid: String
) -> Instruction {
    let (owner_cek_account, _) = get_cek_account_address_with_seed(owner_did, channel_account);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::RemoveCEK { kid },
        vec![
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner_authority, true),
            AccountMeta::new(*owner_cek_account, false),
        ],
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::tests::test_channel_data;
    use solana_program::program_error::ProgramError;

    #[test]
    fn serialize_initialize() {
        let size = ChannelData::DEFAULT_SIZE;
        let alias = "Alice";
        let init_data = test_channel_data();
        let mut expected = vec![0];
        expected.extend_from_slice(&size.to_le_bytes());
        expected.append(&mut init_data.try_to_vec().unwrap());
        let instruction = SolariumInstruction::Initialize { };//size, alias };
        assert_eq!(instruction.try_to_vec().unwrap(), expected);
        assert_eq!(
            SolariumInstruction::try_from_slice(&expected).unwrap(),
            instruction
        );
    }

    #[test]
    fn serialize_write() {
        let data = test_channel_data().try_to_vec().unwrap();
        let offset = 0u64;
        let instruction = SolariumInstruction::Write {
            offset: 0,
            data: data.clone(),
        };
        let mut expected = vec![1];
        expected.extend_from_slice(&offset.to_le_bytes());
        expected.append(&mut data.try_to_vec().unwrap());
        assert_eq!(instruction.try_to_vec().unwrap(), expected);
        assert_eq!(
            SolariumInstruction::try_from_slice(&expected).unwrap(),
            instruction
        );
    }

    #[test]
    fn serialize_close_account() {
        let instruction = SolariumInstruction::CloseAccount;
        let expected = vec![2];
        assert_eq!(instruction.try_to_vec().unwrap(), expected);
        assert_eq!(
            SolariumInstruction::try_from_slice(&expected).unwrap(),
            instruction
        );
    }

    #[test]
    fn deserialize_invalid_instruction() {
        let expected = vec![12];
        let err: ProgramError = SolariumInstruction::try_from_slice(&expected)
            .unwrap_err()
            .into();
        assert!(matches!(err, ProgramError::BorshIoError(_)));
    }
}
