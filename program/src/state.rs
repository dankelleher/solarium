//! Program state
use {
    crate::id,
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        pubkey::Pubkey,
        program_pack::IsInitialized,
        msg,
        clock::{UnixTimestamp},
        sysvar::{
            clock::{Clock}, Sysvar
        },
    },
    std::{
        collections::VecDeque
    },
};
use crate::error::SolariumError;

/// Structure of a channel
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct ChannelData {
    pub name: String,
    /// All of the messages in the channel
    pub messages: Vec<Message>
}
impl ChannelData {
    /// Default size of struct
    pub const DEFAULT_SIZE: u8 = 8;

    /// Max message size
    pub const MESSAGE_SIZE: u32 = 512;
    
    /// Create a new channel
    pub fn new(name: String) -> Self {
        Self {
            name,
            messages: Vec::with_capacity(usize::from(ChannelData::DEFAULT_SIZE))
        }
    }

    /// Post a message to the channel
    pub fn post(&mut self, message: Message) {
        let mut message_deque: VecDeque<Message> = self.messages.clone().into();
        message_deque.push_back(message);
        
        msg!("deque len {}, vec capacity {}", message_deque.len(), usize::from(ChannelData::DEFAULT_SIZE) );
        if message_deque.len() > usize::from(ChannelData::DEFAULT_SIZE) {
            message_deque.pop_front();
        }
        
        self.messages = message_deque.into()
    }
}
impl IsInitialized for ChannelData {
    /// Checks if a channel has been initialized
    fn is_initialized(&self) -> bool {
        !self.name.to_bytes().is_empty()
    }
}

#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct CEKData {
    // TODO agree with Martin
    // pub header: ???
    
    /// The identifier on the owner DID of the key that this CEK is encrypted with
    pub kid: string,
    /// The CEK itself, encrypted by the DID key
    pub encrypted_key: string,
    
}

/// Defines a CEK account structure.
/// A CEK account is one that stores encrypted CEKs for a particular channnel
/// encrypted for a particular DID.
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct CEKAccountData {
    /// The DID that can decrypt the CEKs in this account
    pub owner_did: Pubkey,
    /// The channel that these CEKs decrypt
    pub channel: Pubkey,
    // The CEKs for the channel, one per key in the owner DID
    pub ceks: Vec<CEKData>
}
impl CEKAccountData {
    pub const MAX_CEKS: u8 = 8;
    
    /// Create a new CEKAccount
    pub fn new(owner_did: Pubkey, channel: Pubkey) -> Self {
        Self {
            owner_did,
            channel,
            ceks: Vec::with_capacity(usize::from(CEKAccountData::MAX_CEKS))
        }
    }

    /// add a new CEK to the account
    pub fn add(&mut self, cek: CEKData) {
        self.ceks.push(cek);
    }
    
    pub fn remove(&mut self, kid: string) -> Result<(), SolariumError> {
        let find_result = self.ceks.iter().find_position(|cek| cek.kid == kid);
        
        match find_result {
            None => Err(SolariumError::CEKNotFound),
            Some((index)) => {
                self.ceks.remove(index);
                Ok(())
            }
        }
    }
}
impl IsInitialized for CEKAccountData {
    /// Checks if a CEK account has been initialized
    fn is_initialized(&self) -> bool {
        !self.owner_did.to_bytes().is_empty()
    }
}


/// The seed string used to derive a program address for a Solarium channel (for direct channels)
pub const CHANNEL_ADDRESS_SEED: &'static [u8; 16] = br"solarium_channel";

/// The seed string used to derive a program address for a Solarium cek account
pub const CEK_ACCOUNT_ADDRESS_SEED: &'static [u8; 20] = br"solarium_cek_account";

/// Get program-derived channel address for the authority
pub fn get_channel_address_with_seed(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[&authority.to_bytes(), CHANNEL_ADDRESS_SEED], &id())
}

/// Struct for the Message object
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct Message {
    /// The unix timestamp at which the message was received
    pub timestamp: i64,
    /// The message sender DID
    pub sender: Pubkey,
    /// The (typically encrypted) message content
    pub content: String,
}

impl Message {
    /// Create a new message
    pub fn new(sender: Pubkey, content: String) -> Self {
        let clock = Clock::get().unwrap();
        Self {
            timestamp: clock.unix_timestamp,
            sender,
            content: content.to_string(),
        }
    }
}


#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::borsh as program_borsh;


}
