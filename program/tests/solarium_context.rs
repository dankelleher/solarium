use solana_program_test::{ProgramTestContext, ProgramTest, processor};
use solarium::{
    id,
    processor::process_instruction
};
use sol_did::{
    id as did_program_id,
    instruction as did_instruction,
    processor::process_instruction as did_process_instruction
};
use sol_did::state::{SolData, get_sol_address_with_seed};
use solana_sdk::{
    signature::Signer,
    transaction::Transaction,
    pubkey::Pubkey,
    signature::Keypair,
    process_instruction::ProcessInstructionWithContext
};


fn program_test(name: &str, id: Pubkey, processor: Option<ProcessInstructionWithContext>) -> ProgramTest {
    ProgramTest::new(name, id, processor)
}

pub struct SolariumContext {
    pub context: ProgramTestContext,
    pub channel: Option<Pubkey>,
    pub alice: Keypair,
    pub bob: Keypair,
    pub alice_did: Pubkey,
    pub bob_did: Pubkey,
}
impl SolariumContext {
    async fn make_did(context: &mut ProgramTestContext, authority: &Keypair) -> Pubkey {
        let (did_address, _) = get_sol_address_with_seed(&authority.pubkey());
        let transaction = Transaction::new_signed_with_payer(
            &[did_instruction::initialize(
                &context.payer.pubkey(),
                &authority.pubkey(),
                SolData::DEFAULT_SIZE as u64,
                SolData::default(),
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        context.banks_client.process_transaction(transaction).await.unwrap();

        did_address
    }

    pub async fn new() -> Self {
        let mut test =
            ProgramTest::new("solarium", id(), processor!(process_instruction));
        test.add_program("sol_did", did_program_id(), None);
        let mut context = test.start_with_context().await;
        
        let alice = Keypair::new();
        let bob = Keypair::new();
        let alice_did = SolariumContext::make_did(&mut context, &alice).await;
        let bob_did = SolariumContext::make_did(&mut context, &bob).await;

        Self {
            context,
            alice,
            bob,
            alice_did,
            bob_did,
            channel: None
        }
    }
    
    pub async fn create_channel() {
        
    }
}