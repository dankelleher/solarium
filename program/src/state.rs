//! Program state
use crate::error::SolariumError;
use crate::state::NotificationType::GroupChannel;
use {
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        program_pack::IsInitialized,
        pubkey::Pubkey,
        sysvar::{clock::Clock, Sysvar},
    },
    std::collections::VecDeque,
};

fn push_into_deque<T>(vec: Vec<T>, entry: T, size: usize) -> Vec<T> {
    let mut deque: VecDeque<T> = VecDeque::from(vec);
    deque.push_back(entry);

    if deque.len() > size {
        deque.pop_front();
    }

    deque.into()
}

/// Structure of a channel
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct ChannelData {
    /// The channel nae
    pub name: String,
    /// All of the messages in the channel
    pub messages: Vec<Message>,
}
impl ChannelData {
    /// Default message count
    pub const DEFAULT_SIZE: u8 = 8;

    /// Max message size
    pub const MESSAGE_SIZE: u32 = 512;

    /// Create a new channel
    pub fn new(name: String) -> Self {
        Self {
            name,
            messages: Vec::with_capacity(usize::from(ChannelData::DEFAULT_SIZE)),
        }
    }

    /// Post a message to the channel
    pub fn post(&mut self, mut message: Message) {
        let clock = Clock::get().unwrap();
        message.timestamp = clock.unix_timestamp;
        self.messages = push_into_deque(
            self.messages.clone(),
            message,
            ChannelData::DEFAULT_SIZE as usize,
        );
    }

    /// The maximum size of a channel in bytes
    pub fn size_bytes() -> u64 {
        (((ChannelData::DEFAULT_SIZE as u32) * ChannelData::MESSAGE_SIZE) + 64) as u64
        // TODO max title size
    }
}
impl IsInitialized for ChannelData {
    /// Checks if a channel has been initialized
    fn is_initialized(&self) -> bool {
        !self.name.is_empty()
    }
}

/// A Content Encryption Key for a channel encrypted with a key on the DID of the owner
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct CEKData {
    // TODO agree with Martin
    /// The header information for the CEK
    pub header: String,
    /// The identifier on the owner DID of the key that this CEK is encrypted with
    pub kid: String,
    /// The CEK itself, encrypted by the DID key
    pub encrypted_key: String,
}

/// Defines a CEK account structure.
/// A CEK account is one that stores encrypted CEKs for a particular channel
/// encrypted for a particular DID.
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct CEKAccountData {
    /// The DID that can decrypt the CEKs in this account
    pub owner_did: Pubkey,
    /// The channel that these CEKs decrypt
    pub channel: Pubkey,
    /// The CEKs for the channel, one per key in the owner DID
    pub ceks: Vec<CEKData>,
}
impl CEKAccountData {
    /// The maximum number of CEKs that can be added to an individual CEK account
    pub const MAX_CEKS: u8 = 8;

    /// Create a new CEKAccount
    pub fn new(owner_did: Pubkey, channel: Pubkey) -> Self {
        Self {
            owner_did,
            channel,
            ceks: Vec::with_capacity(usize::from(CEKAccountData::MAX_CEKS)),
        }
    }

    /// Add a number of CEKs to the account at the same time
    pub fn add_all(&mut self, ceks: Vec<CEKData>) {
        ceks.iter().for_each(|cek| self.ceks.push(cek.clone()))
    }

    /// add a new CEK to the account
    pub fn add(&mut self, cek: CEKData) {
        self.ceks.push(cek);
    }

    /// remove a CEK from the account by key ID
    pub fn remove(&mut self, kid: String) -> Result<(), SolariumError> {
        let find_result = self.ceks.iter().position(|cek| cek.kid == kid);

        match find_result {
            None => Err(SolariumError::CEKNotFound),
            Some(index) => {
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

/// Defines a UserDetails account structure
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct UserDetails {
    /// The user's public alias
    pub alias: String,
    /// The user's encrypted address book
    pub address_book: String,
}
impl UserDetails {
    /// The recommended default size of a userDetails account
    pub const DEFAULT_SIZE_BYTES: u32 = 1536; //1.5kb
}
impl IsInitialized for UserDetails {
    /// Checks if a UserDetails account has been initialized
    fn is_initialized(&self) -> bool {
        !self.alias.is_empty()
    }
}

/// Struct for the NotificationType object
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub enum NotificationType {
    /// The user has been added to a group channel. The pubkey is the channel address.
    GroupChannel,
    /// The user has been added to a direct channel.
    /// The pubkey is the address of the DID of the other user in the direct channel.
    DirectChannel,
}
impl Default for NotificationType {
    fn default() -> NotificationType {
        GroupChannel
    }
}

/// Struct for the Notification object
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct Notification {
    /// The type of event that this notification is about
    pub notification_type: NotificationType,
    /// The public key relating to the notification.
    /// The key should be interpreted in relation to the notification type.
    pub pubkey: Pubkey,
}

/// Defines a Notifications account structure
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct Notifications {
    /// The circular buffer of notifications for the user
    pub notifications: Vec<Notification>,
    /// The amount of notifications this user can hold simultaneously
    pub size: u8,
}
impl Notifications {
    /// Default size of the notifications buffer
    pub const DEFAULT_SIZE: u8 = 8;

    /// Create a new notifications account
    pub fn new(size: u8) -> Self {
        Self {
            notifications: Vec::with_capacity(usize::from(size)),
            size,
        }
    }

    /// Add a notification to the account - pushing out an old one if necessary
    pub fn add(&mut self, notification: Notification) {
        self.notifications =
            push_into_deque(self.notifications.clone(), notification, self.size as usize);
    }

    /// Get the allocated size of the Notifications account in bytes
    pub fn size_bytes(&self) -> u64 {
        (((8 + 1) * self.size) + 1) as u64
    }
}
impl IsInitialized for Notifications {
    /// Checks if a Notifications account has been initialized
    fn is_initialized(&self) -> bool {
        self.size > 0
    }
}

/// The seed string used to derive a program address for a Solarium channel (for direct channels)
pub const CHANNEL_ADDRESS_SEED: &[u8; 16] = br"solarium_channel";

/// The seed string used to derive a program address for a Solarium cek account
pub const CEK_ACCOUNT_ADDRESS_SEED: &[u8; 20] = br"solarium_cek_account";

/// The seed string used to derive a program address for a Solarium cek account
pub const USERDETAILS_ACCOUNT_ADDRESS_SEED: &[u8; 28] = br"solarium_userdetails_account";

/// The seed string used to derive a program address for a Solarium notifications account
pub const NOTIFICATIONS_ACCOUNT_ADDRESS_SEED: &[u8; 30] = br"solarium_notifications_account";

/// Get program-derived cek account address for the did and channel
pub fn get_cek_account_address_with_seed(
    program_id: &Pubkey,
    did: &Pubkey,
    channel: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            &did.to_bytes(),
            &channel.to_bytes(),
            CEK_ACCOUNT_ADDRESS_SEED,
        ],
        program_id,
    )
}

/// Get program-derived user details account address for the did
pub fn get_userdetails_account_address_with_seed(
    program_id: &Pubkey,
    did: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[&did.to_bytes(), USERDETAILS_ACCOUNT_ADDRESS_SEED],
        program_id,
    )
}

/// Get program-derived notifications account address for the did
pub fn get_notifications_account_address_with_seed(
    program_id: &Pubkey,
    did: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[&did.to_bytes(), NOTIFICATIONS_ACCOUNT_ADDRESS_SEED],
        program_id,
    )
}

/// To ensure predictable account addresses, sort the DIDs.
pub fn direct_channel_address_order<'a>(did0: &'a Pubkey, did1: &'a Pubkey) -> [&'a Pubkey; 2] {
    match *did0 < *did1 {
        true => [did0, did1],
        false => [did1, did0],
    }
}

/// Get the program-derived channel account address for a direct channel
pub fn get_channel_address_with_seed(
    program_id: &Pubkey,
    did0: &Pubkey,
    did1: &Pubkey,
) -> (Pubkey, u8) {
    // To ensure predictable account addresses, sort the DIDs.
    let [a, b] = direct_channel_address_order(did0, did1);
    Pubkey::find_program_address(
        &[&a.to_bytes(), &b.to_bytes(), CHANNEL_ADDRESS_SEED],
        program_id,
    )
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
    /// Create a new message without a timestamp, for transport to the chain
    pub fn new(sender: Pubkey, content: String) -> Self {
        Self {
            timestamp: 0,
            sender,
            content,
        }
    }

    /// Create a new message and set its timestamp
    pub fn new_with_timestamp(sender: Pubkey, content: String) -> Self {
        let clock = Clock::get().unwrap();
        Self {
            timestamp: clock.unix_timestamp,
            sender,
            content,
        }
    }
}

#[cfg(test)]
pub mod tests {}
