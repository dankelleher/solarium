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
use crate::state::CEKData;

/// Instructions supported by the program
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum ChannelInstruction {
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
    /// 3. `[signer]` Sender CEK account for this channel (proves permissions to write to this channel)
    Post {
        /// The encrypted message content
        message: String,
    },

    /// Create a new CEK Account for a DID and a channel
    /// 
    /// Creating 
    /// 
    /// Note - this 
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[]` Owner DID account - must be owned by the sol-did program
    /// 1. `[]` Inviter DID account - must be owned by the sol-did program
    /// 2. `[signer]` Inviter authority - must be a key on the inviter DID
    /// 2. `[writable]` Inviter CEK account, this ensures the inviter has permissions to add new users
    /// 3. `[writable]` Unallocated CEK account, must be a program address
    /// 4. `[]` Channel account, must be previously initialized
    /// 5. `[]` Rent sysvar
    /// 6. `[]` System program
    InitializeCEKAccount {
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
    RemoveCEK { kid: string }
}

/// Create a `SolariumInstruction::InitializeChannel` instruction
pub fn initialize_channel(
    funder_account: &Pubkey,
    owner_did: &Pubkey,
    size: u8,
    alias: String
) -> Instruction {
    let (channel_account, _) = get_channel_address_with_seed(owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::InitializeChannel { },//size, alias },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(channel_account, false),
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `SolariumInstruction::Post` instruction
pub fn post(channel_account: &Pubkey, signer: &Pubkey, message: &Message) -> Instruction {
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::Post { message: message.content.to_string() },
        vec![
            AccountMeta::new(*channel_account, false),
            AccountMeta::new_readonly(message.sender, false),
            AccountMeta::new_readonly(*signer, true),
        ],
    )
}

/// Create a `SolariumInstruction::CloseAccount` instruction
pub fn close_account(channel_account: &Pubkey, owner_did: &Pubkey, owner: &Pubkey, receiver: &Pubkey) -> Instruction {
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::CloseAccount,
        vec![
            AccountMeta::new(*channel_account, false),
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner, true),
            AccountMeta::new(*receiver, false),
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
