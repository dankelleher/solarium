import { SolariumCrypto } from "../../../../src/lib/crypto/SolariumCrypto";
import {Account, PublicKey} from "@solana/web3.js";
import * as solDID from '@identity.com/sol-did-client';
import {mocked} from "ts-jest";
import {when} from "jest-when";
import {DIDDocument} from "did-resolver";
import { convertPublicKey } from 'ed2curve-esm'
import {encode} from 'bs58'

jest.mock('@identity.com/sol-did-client');
const mockedResolve = mocked(solDID.resolve, true);

const dummyDIDDoc = (did: string, pubkey: PublicKey):DIDDocument => ({
  id: did,
  publicKey: [{
    id: 'dummy',
    type: 'Ed25519VerificationKey2018',
    controller: did,
    publicKeyBase58: pubkey.toBase58()
  }]
})

describe('Crypto', () => {
  const aliceDID = 'did:dummy:alice';
  const bobDID = 'did:dummy:bob';
  const elviraDID = 'did:dummy:elvira';
  
  const aliceAccount = new Account();
  const bobAccount = new Account();
  const elviraAccount = new Account();
  
  const cryptoAlice = new SolariumCrypto(aliceDID, aliceAccount.secretKey);
  const cryptoBob = new SolariumCrypto(bobDID, bobAccount.secretKey);
  const cryptoElvira = new SolariumCrypto(elviraDID, elviraAccount.secretKey);
  
  beforeEach(() => {
    when(mockedResolve)
      .calledWith(aliceDID).mockResolvedValue(dummyDIDDoc(aliceDID, aliceAccount.publicKey))
      .calledWith(bobDID).mockResolvedValue(dummyDIDDoc(bobDID, bobAccount.publicKey))
      .calledWith(elviraDID).mockResolvedValue(dummyDIDDoc(elviraDID, elviraAccount.publicKey));
  })

  it('creates a signed token', async () => {
    const payload = { message: 'Hi, I am definitely Alice' };
    const jwt = await cryptoAlice.createToken(payload);
    
    const verificationResult = await cryptoAlice.verifyToken(jwt)
    expect(verificationResult.issuer).toEqual(aliceDID);
  })

  it('encrypts a message', async () => {
    const message = 'for Bob\'s eyes only';
    const encrypted = await cryptoAlice.encrypt(message, bobDID);
    const decrypted = await cryptoBob.decrypt(encrypted);
    
    expect(decrypted).toEqual(message);
  })
})