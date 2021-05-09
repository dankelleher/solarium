import {create, close, post, read} from "../src";
import {create as createDID} from "../src/lib/did/create";
import {SolanaUtil} from "../src/lib/solana/solanaUtil";
import {Keypair} from "@solana/web3.js";
import {Inbox} from "../src/lib/Inbox";
import {repeat} from 'ramda';
import {DEFAULT_MAX_MESSAGE_COUNT} from "../src/lib/constants";

describe('E2E', () => {
  const connection = SolanaUtil.getConnection();
  let payer: Keypair;
  let owner: Keypair;
  let inbox: Inbox;

  beforeAll(async () => {
    payer = await SolanaUtil.newWalletWithLamports(connection, 100000000)
  })

  beforeEach(() => {
    owner = Keypair.generate();
  })

  // Clean up after each test
  afterEach(async ()  => {
    await close({
      ownerDID: inbox.owner,
      signer: owner.secretKey,
      payer: payer.secretKey
    })
  })

  it('creates a DID and inbox', async () => {
    inbox = await create({ payer: payer.secretKey, owner: owner.publicKey.toBase58() });
  });

  it('creates an inbox for an existing DID', async () => {
    await createDID(owner.publicKey, payer);

    inbox = await create({
      payer: payer.secretKey,
      owner: owner.publicKey.toBase58()
    });
  });

  it('sends a message to an inbox', async () => {
    inbox = await create({
      owner: owner.publicKey.toBase58(),
      payer: payer.secretKey
    });

    const message = 'Hello me!';
    await post({
      payer: payer.secretKey,
      ownerDID: inbox.owner,
      senderDID: inbox.owner,
      signer: owner.secretKey,
      message
    })

    const messages = await read({ ownerDID: inbox.owner, ownerKey: owner.secretKey });
    
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toEqual(message);
    expect(messages[0].sender).toEqual(inbox.owner);
  });

  it('sends more messages than an inbox can hold', async () => {
    const inboxSize = DEFAULT_MAX_MESSAGE_COUNT;
    
    inbox = await create({
      owner: owner.publicKey.toBase58(),
      payer: payer.secretKey
    });

    // send one more message than the inbox can hold
    for (let i = 0; i < inboxSize + 1; i++) {
      console.log(`Posting message ${i}`);
      await post({
        payer: payer.secretKey,
        ownerDID: inbox.owner,
        senderDID: inbox.owner,
        signer: owner.secretKey,
        message: `This is message ${i}`
      })
    }

    const messages = await read({ ownerDID: inbox.owner, ownerKey: owner.secretKey });

    expect(messages).toHaveLength(inboxSize);
    expect(messages[0].content).toEqual('This is message 1');
  }, 20000);

  it('blocks sending a large message to an inbox', async () => {
    inbox = await create({
      owner: owner.publicKey.toBase58(),
      payer: payer.secretKey
    });

    const message = repeat('This is a long message.', 50).join('');
    const shouldFail = post({
      payer: payer.secretKey,
      ownerDID: inbox.owner,
      senderDID: inbox.owner,
      signer: owner.secretKey,
      message
    })
    
    return expect(shouldFail).rejects.toThrow(/Message too long/);
  });
});
