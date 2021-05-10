// Mark this test as BPF-only due to current `ProgramTest` limitations when CPIing into the system program
#![cfg(feature = "test-bpf")]

use solana_program_test::tokio;
use solana_sdk::account::Account;
use solana_sdk::program_error::ProgramError;
use {
    borsh::BorshSerialize,
    solana_program::{
        instruction::{AccountMeta, Instruction, InstructionError},
        pubkey::Pubkey,
        rent::Rent,
    },
    solana_program_test::{processor, ProgramTest, ProgramTestContext},
    solana_sdk::{
        account_info::IntoAccountInfo,
        signature::{Keypair, Signer},
        transaction::{Transaction, TransactionError},
        transport,
    },
};

fn program_test() -> ProgramTest {
    ProgramTest::new("solarium", id(), processor!(process_instruction))
}