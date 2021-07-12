import {
  create,
  createDirect,
  post,
  postDirect,
  read,
  addKey,
  Channel,
  getDirect,
  get,
  addToChannel,
  readStream,
  Message,
} from '../src';
import { create as createDID } from '../src/api/id/create';
import { get as getDID } from '../src/api/id/get';
import { create as createUserDetails } from '../src/api/userDetails/create';
import { get as getUserDetails } from '../src/api/userDetails/get';
import { SolanaUtil } from '../src/lib/solana/solanaUtil';
import { Keypair } from '@solana/web3.js';
import { repeat } from 'ramda';
import { DEFAULT_MAX_MESSAGE_COUNT } from '../src/lib/constants';
import { ClusterType, keyToIdentifier } from '@identity.com/sol-did-client';

describe('E2E', () => {
  const connection = SolanaUtil.getConnection();
  let payer: Keypair;
  let alice: Keypair;
  let bob: Keypair;

  let aliceDID: string;
  let bobDID: string;

  let channel: Channel;

  beforeAll(async () => {
    payer = await SolanaUtil.newWalletWithLamports(connection, 1000000000);
  });

  beforeEach(async () => {
    alice = Keypair.generate();
    bob = Keypair.generate();

    aliceDID = await keyToIdentifier(
      alice.publicKey,
      ClusterType.development()
    );
    bobDID = await keyToIdentifier(bob.publicKey, ClusterType.development());
  });

  it('creates a DID and group channel', async () => {
    const channelName = 'dummy channel' + Date.now();
    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: channelName,
    });

    const did = await getDID({ owner: alice.publicKey.toBase58() });

    expect(did.id).toEqual(aliceDID);

    expect(channel.name).toEqual(channelName);
  });

  it('creates a group channel with by an existing DID', async () => {
    const channelName = 'dummy channel' + Date.now();

    await createDID({
      payer: payer.secretKey,
      owner: alice.publicKey.toBase58(),
    });

    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: channelName,
    });
  });

  it('creates user details for a DID', async () => {
    await createDID({
      payer: payer.secretKey,
      owner: alice.publicKey.toBase58(),
    });

    await createUserDetails({
      payer: payer.secretKey,
      owner: alice.secretKey,
      alias: 'Alice',
    });

    const aliceUserDetails = await getUserDetails({ did: aliceDID });

    expect(aliceUserDetails?.alias).toEqual('Alice');
  });

  it('adds a user to a group channel', async () => {
    const channelName = 'dummy channel' + Date.now();
    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: channelName,
    });

    // create Bob's DID
    await createDID({
      payer: payer.secretKey,
      owner: bob.publicKey.toBase58(),
    });

    await addToChannel({
      payer: payer.secretKey,
      decryptionKey: alice.secretKey,
      channel: channel.address.toBase58(),
      inviteeDID: bobDID,
    });

    // get as Bob
    const channelForBob = await get({
      ownerDID: bobDID,
      channel: channel.address.toBase58(),
      decryptionKey: bob.secretKey,
    });
    expect(channelForBob.address).toEqual(channel.address);
  });

  it('adds a user twice to a group channel throws an error the second time', async () => {
    const channelName = 'dummy channel ' + Date.now();
    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: channelName,
    });

    // create Bob's DID
    await createDID({
      payer: payer.secretKey,
      owner: bob.publicKey.toBase58(),
    });

    await addToChannel({
      payer: payer.secretKey,
      decryptionKey: alice.secretKey,
      channel: channel.address.toBase58(),
      inviteeDID: bobDID,
    });

    const shouldFail = addToChannel({
      payer: payer.secretKey,
      decryptionKey: alice.secretKey,
      channel: channel.address.toBase58(),
      inviteeDID: bobDID,
    });

    return expect(shouldFail).rejects.toThrow('DID is already a member');
  });

  it('creates a DID and direct channel', async () => {
    await createDID({
      payer: payer.secretKey,
      owner: bob.publicKey.toBase58(),
    });

    channel = await createDirect({
      payer: payer.secretKey,
      owner: alice.secretKey,
      inviteeDID: bobDID,
    });

    expect(channel.name).toContain(bobDID.replace('did:sol:localnet:', ''));
  });

  it('gets a direct channel as the partner', async () => {
    // create Bob's DID
    await createDID({
      payer: payer.secretKey,
      owner: bob.publicKey.toBase58(),
    });

    // Alice creates the channel
    channel = await createDirect({
      payer: payer.secretKey,
      owner: alice.secretKey,
      inviteeDID: bobDID,
    });

    // get as Bob
    const channelForBob = await getDirect({
      ownerDID: bobDID,
      decryptionKey: bob.secretKey,
      partnerDID: aliceDID,
    });

    // get as Alice
    const channelForAlice = await getDirect({
      ownerDID: aliceDID,
      decryptionKey: alice.secretKey,
      partnerDID: bobDID,
    });

    expect(channelForAlice.address).toEqual(channel.address);
    expect(channelForBob.address).toEqual(channel.address);
  });

  it('sends a message to a group channel', async () => {
    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: 'dummy',
    });

    const message = 'Hello!';
    await post({
      payer: payer.secretKey,
      channel: channel.address.toBase58(),
      senderDID: aliceDID,
      signer: alice.secretKey,
      message,
    });

    const messages = await read({
      channel: channel.address.toBase58(),
      memberDID: aliceDID,
      decryptionKey: alice.secretKey,
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toEqual(message);
    expect(messages[0].sender).toEqual(aliceDID);
  });

  it('emits events of old message(s) when subscribing to stream', async () => {
    expect.assertions(2);

    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: 'emit-channel',
    });

    const message = 'Hello 1!';
    await post({
      payer: payer.secretKey,
      channel: channel.address.toBase58(),
      senderDID: aliceDID,
      signer: alice.secretKey,
      message,
    });

    const subscription = readStream({
      channel: channel.address.toBase58(),
      memberDID: aliceDID,
      decryptionKey: alice.secretKey,
    }).subscribe((msg: Message) => {
      expect(msg.content).toEqual(message);
      expect(msg.sender).toEqual(aliceDID);
    });

    // sleep 1000
    await new Promise(r => setTimeout(r, 1000));
    subscription.unsubscribe();
  });

  it('emits events of new message(s) after subscribing to stream', async () => {
    expect.assertions(4);

    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: 'emit-channel',
    });

    const messages = ['Hello 1!', 'Hello 2!'];

    await post({
      payer: payer.secretKey,
      channel: channel.address.toBase58(),
      senderDID: aliceDID,
      signer: alice.secretKey,
      message: messages[0],
    });

    let msgIndex = 0;
    const subscription = readStream({
      channel: channel.address.toBase58(),
      memberDID: aliceDID,
      decryptionKey: alice.secretKey,
    }).subscribe((msg: Message) => {
      expect(msg.content).toEqual(messages[msgIndex]);
      expect(msg.sender).toEqual(aliceDID);
      msgIndex++;
    });

    await post({
      payer: payer.secretKey,
      channel: channel.address.toBase58(),
      senderDID: aliceDID,
      signer: alice.secretKey,
      message: messages[1],
    });

    // sleep to finish the observable callbacks
    await new Promise(r => setTimeout(r, 50));
    subscription.unsubscribe();
  });

  it('sends a message to a direct channel', async () => {
    // create bob's did
    await createDID({
      payer: payer.secretKey,
      owner: bob.publicKey.toBase58(),
    });

    channel = await createDirect({
      payer: payer.secretKey,
      owner: alice.secretKey,
      inviteeDID: bobDID,
    });

    const message = 'Hello Bob!';
    await postDirect({
      payer: payer.secretKey,
      senderDID: aliceDID,
      recipientDID: bobDID,
      signer: alice.secretKey,
      message,
    });

    // read as Bob
    const messagesForBob = await read({
      channel: channel.address.toBase58(),
      memberDID: bobDID,
      decryptionKey: bob.secretKey,
    });

    expect(messagesForBob).toHaveLength(1);
    expect(messagesForBob[0].content).toEqual(message);
    expect(messagesForBob[0].sender).toEqual(aliceDID);

    // read as Alice
    const messagesForAlice = await read({
      channel: channel.address.toBase58(),
      memberDID: aliceDID,
      decryptionKey: alice.secretKey,
    });

    expect(messagesForAlice).toEqual(messagesForBob);
  });

  it('sends more messages than a channel can hold', async () => {
    const channelSize = DEFAULT_MAX_MESSAGE_COUNT;

    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: 'dummy',
    });

    // send one more message than the channel can hold
    for (let i = 0; i < channelSize + 1; i++) {
      console.log(`Posting message ${i}`);
      await post({
        payer: payer.secretKey,
        channel: channel.address.toBase58(),
        senderDID: aliceDID,
        signer: alice.secretKey,
        message: `This is message ${i}`,
      });
    }

    const messages = await read({
      channel: channel.address.toBase58(),
      memberDID: aliceDID,
      decryptionKey: alice.secretKey,
    });

    expect(messages).toHaveLength(channelSize);
    expect(messages[0].content).toEqual('This is message 1');
  }, 20000);

  it('blocks sending a large message to a channel', async () => {
    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: 'dummy',
    });

    const message = repeat('This is a long message.', 50).join('');
    const shouldFail = post({
      payer: payer.secretKey,
      channel: channel.address.toBase58(),
      senderDID: aliceDID,
      signer: alice.secretKey,
      message,
    });

    return expect(shouldFail).rejects.toThrow(/Message too long/);
  });

  // This test checks that if a user adds a key to their DID,
  // they can read messages in channels they belong to with this new key
  it('adds a key to the DID', async () => {
    channel = await create({
      payer: payer.secretKey,
      owner: alice.secretKey,
      name: 'dummy',
    });

    const newAliceKey = Keypair.generate();

    const newDoc = await addKey({
      ownerDID: aliceDID,
      payer: payer.secretKey,
      signer: alice.secretKey,
      newKey: newAliceKey.publicKey.toBase58(),
      keyIdentifier: 'mobile',
      channelsToUpdate: [channel.address.toBase58()],
    });

    console.log(newDoc);

    // Alice posts a message with the old key
    const message = 'Hello!';
    await post({
      payer: payer.secretKey,
      channel: channel.address.toBase58(),
      senderDID: aliceDID,
      signer: alice.secretKey,
      message,
    });

    // Check Alice can read the channel with the new key
    const messagesWithNewKey = await read({
      channel: channel.address.toBase58(),
      memberDID: aliceDID,
      decryptionKey: newAliceKey.secretKey,
    });

    expect(messagesWithNewKey).toHaveLength(1);
    expect(messagesWithNewKey[0].content).toEqual(message);
    expect(messagesWithNewKey[0].sender).toEqual(aliceDID);

    // check the old key still works
    const messagesWithOldKey = await read({
      channel: channel.address.toBase58(),
      memberDID: aliceDID,
      decryptionKey: alice.secretKey,
    });
    expect(messagesWithOldKey).toEqual(messagesWithNewKey);
  });

  it('creates a direct channel between users with two keys', async () => {
    // creates alice's did
    await createDID({
      payer: payer.secretKey,
      owner: alice.publicKey.toBase58(),
    });
    // adds a key to alice's did
    await addKey({
      ownerDID: aliceDID,
      payer: payer.secretKey,
      signer: alice.secretKey,
      newKey: Keypair.generate().publicKey.toBase58(),
      keyIdentifier: 'mobile',
      channelsToUpdate: [],
    });

    // creates bob's did
    await createDID({
      payer: payer.secretKey,
      owner: bob.publicKey.toBase58(),
    });
    // adds a key to bob's did
    await addKey({
      ownerDID: bobDID,
      payer: payer.secretKey,
      signer: bob.secretKey,
      newKey: Keypair.generate().publicKey.toBase58(),
      keyIdentifier: 'mobile',
      channelsToUpdate: [],
    });

    // create the direct channel
    channel = await createDirect({
      payer: payer.secretKey,
      owner: alice.secretKey,
      inviteeDID: bobDID,
    });

    expect(channel.name).toContain(bobDID.replace('did:sol:localnet:', ''));
  });
});
