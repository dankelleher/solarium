import { SolariumCrypto } from '../../../../src/lib/crypto/SolariumCrypto';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as solDID from '@identity.com/sol-did-client';
import { mocked } from 'ts-jest/utils';
import { when } from 'jest-when';
import { DIDDocument } from 'did-resolver';

jest.mock('@identity.com/sol-did-client');
const mockedResolve = mocked(solDID.resolve, true);

const dummyDIDDoc = (did: string, ...pubkeys: PublicKey[]): DIDDocument => ({
  id: did,
  publicKey: pubkeys.map((pubKey, index) => ({
    id: `key${index}`,
    type: 'Ed25519VerificationKey2018',
    controller: did,
    publicKeyBase58: pubKey.toBase58(),
  })),
});

describe('SolariumCrypto', () => {
  const aliceDID = 'did:dummy:alice';
  const bobDID = 'did:dummy:bob';
  const elviraDID = 'did:dummy:elvira';

  // Alice has two keys
  const aliceKeypair1 = Keypair.generate();
  const aliceKeypair2 = Keypair.generate();

  const bobKeypair = Keypair.generate();
  const elviraKeypair = Keypair.generate();

  const cryptoAlice = new SolariumCrypto(aliceDID, aliceKeypair1.secretKey);
  const cryptoBob = new SolariumCrypto(bobDID, bobKeypair.secretKey);
  const cryptoElvira = new SolariumCrypto(elviraDID, elviraKeypair.secretKey);

  beforeEach(() => {
    when(mockedResolve)
      .calledWith(aliceDID)
      .mockResolvedValue(
        dummyDIDDoc(aliceDID, aliceKeypair1.publicKey, aliceKeypair2.publicKey)
      )
      .calledWith(bobDID)
      .mockResolvedValue(dummyDIDDoc(bobDID, bobKeypair.publicKey))
      .calledWith(elviraDID)
      .mockResolvedValue(dummyDIDDoc(elviraDID, elviraKeypair.publicKey));
  });

  it('creates a signed token', async () => {
    const payload = { message: 'Hi, I am definitely Alice' };
    const jwt = await cryptoAlice.createToken(payload);

    const verificationResult = await cryptoAlice.verifyToken(jwt);
    expect(verificationResult.issuer).toEqual(aliceDID);
  });

  it('encrypts a message', async () => {
    const message = "for Bob's eyes only";
    const encrypted = await cryptoAlice.encrypt(message, bobDID);

    console.log(JSON.stringify(encrypted, null, 1));

    const decrypted = await cryptoBob.decrypt(encrypted);

    expect(decrypted).toEqual(message);
  });

  it('encrypts a message for a DID with two keys', async () => {
    const message = "for Alice's eyes only";
    const encrypted = await cryptoBob.encrypt(message, aliceDID);

    console.log(JSON.stringify(encrypted, null, 1));

    // Both of Alice's keys can decrypt
    const decrypted1 = await cryptoAlice.decrypt(encrypted);

    const cryptoAliceSecondKey = new SolariumCrypto(
      aliceDID,
      aliceKeypair2.secretKey
    );
    const decrypted2 = await cryptoAliceSecondKey.decrypt(encrypted);

    expect(decrypted1).toEqual(message);
    expect(decrypted2).toEqual(message);
  });

  it('encrypts two messages with different keys', async () => {
    const message1 = 'message 1';
    const message2 = 'message 2';
    const encrypted1 = await cryptoAlice.encrypt(message1, bobDID);
    const encrypted2 = await cryptoAlice.encrypt(message2, bobDID);

    console.log(JSON.stringify(encrypted1, null, 1));
    console.log(JSON.stringify(encrypted2, null, 1));

    expect(encrypted1.recipients![0].encrypted_key).not.toEqual(
      encrypted2.recipients![0].encrypted_key
    );
  });

  it('encrypts a message', async () => {
    const message = "for Bob's eyes only";
    const encrypted = await cryptoAlice.encrypt(message, bobDID);

    console.log(JSON.stringify(encrypted, null, 1));

    const decrypted = await cryptoBob.decrypt(encrypted);

    expect(decrypted).toEqual(message);
  });

  it('prevents unauthorised decryption', async () => {
    const message = "for Bob's eyes only";
    const encrypted = await cryptoAlice.encrypt(message, bobDID);
    const shouldFail = cryptoElvira.decrypt(encrypted);

    return expect(shouldFail).rejects.toThrow();
  });
});
