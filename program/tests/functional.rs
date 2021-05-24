// Mark this test as BPF-only due to current `ProgramTest` limitations when CPIing into the system program
#![cfg(feature = "test-bpf")]

use solana_program_test::tokio;
use {
    crate::solarium_context::SolariumContext
};
use solarium::state::ChannelData;

mod solarium_context;

#[tokio::test]
async fn create_channel() {
    let mut context = SolariumContext::new().await;

    context.create_channel().await;
}

#[tokio::test]
async fn add_cek() {
    let kid = "key2";
    let mut context = SolariumContext::new().await;

    context.create_channel().await;
    context.add_cek(SolariumContext::make_dummy_cekdata(kid)).await;

    let cek_account = context.get_cek_account(context.alice_cek.unwrap()).await;
    let found = cek_account.ceks.iter().any(|cek| cek.kid == kid);

    assert!(found);
}

#[tokio::test]
async fn remove_cek() {
    let kid = "key1";
    let mut context = SolariumContext::new().await;

    context.create_channel().await;
    context.remove_cek(kid).await;

    let cek_account = context.get_cek_account(context.alice_cek.unwrap()).await;
    let found = cek_account.ceks.iter().any(|cek| cek.kid == kid);

    assert!(!found);
}

#[tokio::test]
async fn add_to_channel() {
    let mut context = SolariumContext::new().await;

    context.create_channel().await;
    
    context.add_to_channel().await
}

#[tokio::test]
async fn post() {
    let message = "hello world";
    
    let mut context = SolariumContext::new().await;

    context.create_channel().await;
    context.post(message).await;
    
    let channel = context.get_channel().await;
    
    assert_eq!(channel.messages.len(), 1);
    assert_eq!(channel.messages[0].content, message);
    assert_eq!(channel.messages[0].sender, context.alice_did);
}

#[tokio::test]
async fn post_multiple() {
    let message = "hello world";
    let mut context = SolariumContext::new().await;

    context.create_channel().await;

    // send DEFAULT_SIZE * messages
    for n in 0..(ChannelData::DEFAULT_SIZE * 2) {
        let m = format!("{}{}", message, n);
        println!("Sending {}", m);
        context.post(m.as_str()).await;
    }

    let channel = context.get_channel().await;

    // check the most recent DEFAULT_SIZE messages were retained
    assert_eq!(channel.messages.len(), ChannelData::DEFAULT_SIZE as usize);
    assert_eq!(channel.messages[0].content, format!("{}{}", message, ChannelData::DEFAULT_SIZE));
}

#[tokio::test]
async fn create_direct_channel() {
    let mut context = SolariumContext::new().await;

    context.create_direct_channel().await;

    let alices_message = "hi from alice";
    let bobs_message = "hi from bob";
    
    context.post(alices_message).await;
    context.post_as_bob(bobs_message).await;

    let channel = context.get_channel().await;

    // check the most recent DEFAULT_SIZE messages were retained
    assert_eq!(channel.messages.len(), 2);
    assert_eq!(channel.messages[0].content, alices_message);
    assert_eq!(channel.messages[1].content, bobs_message);
}