use sol_did::{
    id as did_program_id, instruction as did_instruction,
    state::{get_sol_address_with_seed, SolData},
};
use solana_program_test::{processor, ProgramTest, ProgramTestContext};
use solana_sdk::{
    pubkey::Pubkey, signature::Keypair, signature::Signer, system_instruction::create_account,
    transaction::Transaction,
};
use solarium::state::{
    get_channel_address_with_seed, get_notifications_account_address_with_seed,
    get_userdetails_account_address_with_seed, CEKAccountDataV1, Message, NotificationType,
    Notifications, UserDetails,
};
use solarium::{
    borsh as program_borsh, id, instruction,
    processor::process_instruction,
    state::get_cek_account_address_with_seed,
    state::{CEKData, ChannelData},
};

pub struct SolariumContext {
    pub context: ProgramTestContext,
    pub channel: Option<Pubkey>,
    pub alice: Keypair,
    pub bob: Keypair,
    pub alice_did: Pubkey,
    pub bob_did: Pubkey,
    pub alice_cek: Option<Pubkey>,
    pub alice_user_details: Option<Pubkey>,
    pub alice_notifications: Option<Pubkey>,
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
        context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();

        did_address
    }

    pub async fn new() -> Self {
        let mut test = ProgramTest::new("solarium", id(), processor!(process_instruction));
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
            alice_cek: None,
            alice_user_details: None,
            alice_notifications: None,
            channel: None,
        }
    }

    pub async fn create_channel(&mut self) -> () {
        let channel = Keypair::new();
        let alice_ceks = vec![SolariumContext::make_dummy_cekdata("key1")];

        let channel_size = ChannelData::size_bytes();
        let lamports = self
            .context
            .banks_client
            .get_rent()
            .await
            .unwrap()
            .minimum_balance(channel_size as usize);
        let create_channel = create_account(
            &self.context.payer.pubkey(),
            &channel.pubkey(),
            lamports,
            channel_size,
            &id(),
        );

        let initialize_channel = instruction::initialize_channel(
            &self.context.payer.pubkey(),
            &channel.pubkey(),
            "test channel".to_string(),
            &self.alice_did,
            &self.alice.pubkey(),
            alice_ceks,
        );
        let transaction = Transaction::new_signed_with_payer(
            &[create_channel, initialize_channel],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &channel, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();

        let (alice_cek_account, _) =
            get_cek_account_address_with_seed(&id(), &self.alice_did, &channel.pubkey());
        self.alice_cek = Some(alice_cek_account);
        self.channel = Some(channel.pubkey());
    }

    pub async fn create_direct_channel(&mut self) -> () {
        let alice_ceks = vec![SolariumContext::make_dummy_cekdata("key1")];
        let bob_ceks = vec![SolariumContext::make_dummy_cekdata("key1")];

        let (channel, _) = get_channel_address_with_seed(&id(), &self.alice_did, &self.bob_did);
        let initialize_direct_channel = instruction::initialize_direct_channel(
            &self.context.payer.pubkey(),
            &channel,
            &self.alice_did,
            &self.alice.pubkey(),
            &self.bob_did,
            alice_ceks,
            bob_ceks,
        );

        let transaction = Transaction::new_signed_with_payer(
            &[initialize_direct_channel],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();

        let (alice_cek_account, _) =
            get_cek_account_address_with_seed(&id(), &self.alice_did, &channel);
        self.alice_cek = Some(alice_cek_account);
        self.channel = Some(channel);
    }

    pub async fn add_to_channel(&mut self) -> () {
        let bob_ceks = vec![SolariumContext::make_dummy_cekdata("key1")];

        let add_to_channel = instruction::add_to_channel(
            &self.context.payer.pubkey(),
            &self.channel.unwrap(),
            &self.bob_did,
            &self.alice_did,
            &self.alice.pubkey(),
            bob_ceks,
        );
        let transaction = Transaction::new_signed_with_payer(
            &[add_to_channel],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();
    }

    pub async fn post(&mut self, message: &str) -> () {
        let message_obj = Message::new(self.alice_did, message.to_string());

        let post = instruction::post(&self.channel.unwrap(), &self.alice.pubkey(), &message_obj);
        let transaction = Transaction::new_signed_with_payer(
            &[post],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();
    }

    pub async fn post_as_bob(&mut self, message: &str) -> () {
        let message_obj = Message::new(self.bob_did, message.to_string());

        let post = instruction::post(&self.channel.unwrap(), &self.bob.pubkey(), &message_obj);
        let transaction = Transaction::new_signed_with_payer(
            &[post],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.bob],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();
    }

    pub fn make_dummy_cekdata(kid: &str) -> CEKData {
        CEKData {
            header: "".to_string(),
            kid: kid.to_string(),
            encrypted_key: "".to_string(),
        }
    }

    pub async fn get_channel(&mut self) -> ChannelData {
        let account_info = &self
            .context
            .banks_client
            .get_account(self.channel.unwrap())
            .await
            .unwrap()
            .unwrap();
        let account_data =
            program_borsh::try_from_slice_incomplete::<ChannelData>(&account_info.data).unwrap();

        account_data
    }

    pub async fn get_cek_account(&mut self, address: Pubkey) -> CEKAccountDataV1 {
        let account_info = &self
            .context
            .banks_client
            .get_account(address)
            .await
            .unwrap()
            .unwrap();
        let account_data =
            program_borsh::try_from_slice_incomplete::<CEKAccountDataV1>(&account_info.data).unwrap();

        account_data
    }

    pub async fn add_cek(&mut self, cek: CEKData) -> () {
        let add_cek = instruction::add_cek(
            &self.alice_did,
            &self.alice.pubkey(),
            &self.channel.unwrap(),
            cek,
        );
        let transaction = Transaction::new_signed_with_payer(
            &[add_cek],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap_or_else(|e| println!("{:#?}", e));
    }

    pub async fn remove_cek(&mut self, kid: &str) -> () {
        let remove_cek = instruction::remove_cek(
            &self.alice_did,
            &self.alice.pubkey(),
            &self.channel.unwrap(),
            kid.to_string(),
        );
        let transaction = Transaction::new_signed_with_payer(
            &[remove_cek],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();
    }

    pub async fn create_user_details(&mut self) -> () {
        let (alice_user_details, _) =
            get_userdetails_account_address_with_seed(&id(), &self.alice_did);

        let create_user_details_account = instruction::create_user_details(
            &self.context.payer.pubkey(),
            &self.alice_did,
            &self.alice.pubkey(),
            "Alice".to_string(),
            UserDetails::DEFAULT_SIZE_BYTES,
        );
        let transaction = Transaction::new_signed_with_payer(
            &[create_user_details_account],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();

        self.alice_user_details = Some(alice_user_details);
    }

    pub async fn update_user_details(&mut self, new_alias: &str, new_address_book: &str) -> () {
        let update_user_details_account = instruction::update_user_details(
            &self.alice_did,
            &self.alice.pubkey(),
            new_alias.to_string(),
            new_address_book.to_string(),
        );
        let transaction = Transaction::new_signed_with_payer(
            &[update_user_details_account],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();
    }

    pub async fn get_user_details(&mut self) -> UserDetails {
        let account_info = &self
            .context
            .banks_client
            .get_account(self.alice_user_details.unwrap())
            .await
            .unwrap()
            .unwrap();
        let account_data =
            program_borsh::try_from_slice_incomplete::<UserDetails>(&account_info.data).unwrap();

        account_data
    }

    pub async fn create_notifications(&mut self) -> () {
        let (alice_notifications, _) =
            get_notifications_account_address_with_seed(&id(), &self.alice_did);

        let create_notifications_account = instruction::create_notifications(
            &self.context.payer.pubkey(),
            &self.alice_did,
            &self.alice.pubkey(),
            Notifications::DEFAULT_SIZE,
        );
        let transaction = Transaction::new_signed_with_payer(
            &[create_notifications_account],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.alice],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();

        self.alice_notifications = Some(alice_notifications);
    }

    pub async fn get_notifications(&mut self) -> Notifications {
        let account_info = &self
            .context
            .banks_client
            .get_account(self.alice_notifications.unwrap())
            .await
            .unwrap()
            .unwrap();
        let account_data =
            program_borsh::try_from_slice_incomplete::<Notifications>(&account_info.data).unwrap();

        account_data
    }

    pub async fn add_notification(
        &mut self,
        notification_type: NotificationType,
        pubkey: &Pubkey,
    ) -> () {
        let add_notification = instruction::add_notification(
            notification_type,
            pubkey,
            &self.alice_did,
            &self.bob_did,
            &self.bob.pubkey(),
        );
        let transaction = Transaction::new_signed_with_payer(
            &[add_notification],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &self.bob],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();
    }
}
