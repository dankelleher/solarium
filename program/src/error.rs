//! Error types

use {
    num_derive::FromPrimitive,
    solana_program::{decode_error::DecodeError, program_error::ProgramError},
    thiserror::Error,
};

/// Errors that may be returned by the program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum SolariumError {
    /// Incorrect authority provided
    #[error("Incorrect authority provided")]
    IncorrectAuthority,

    /// Calculation overflow
    #[error("Calculation overflow")]
    Overflow,

    /// Missing CEK
    #[error("CEK not found")]
    CEKNotFound,

    /// Invalid CEK for this channel
    #[error("CEK not valid for this channel")]
    CEKIncorrectChannel,

    /// Attempt to create a channel for an address that is already in use
    #[error("Attempt to create a channel for an address that is already in use")]
    AlreadyInUse,

    /// Incorrect account address derivation
    #[error("Incorrect account address derivation")]
    AddressDerivationMismatch,

    /// Missing key
    #[error("Key not found")]
    KeyNotFound,
}
impl From<SolariumError> for ProgramError {
    fn from(e: SolariumError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
// impl From<ParsePubkeyError> for SolariumError {
//     fn from(_e: ParsePubkeyError) -> Self {
//         SolError::InvalidString
//     }
// }
impl<T> DecodeError<T> for SolariumError {
    fn type_of() -> &'static str {
        "Solarium Error"
    }
}
