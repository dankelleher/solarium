import { SolanaUtil } from '../../../../src/lib/solana/solanaUtil';
import { SolariumTransaction } from '../../../../src/lib/solana/transaction';
import {Channel, createDID} from '../../../../src';
import { ClusterType, keyToIdentifier } from '@identity.com/sol-did-client';
import { Keypair } from '@solana/web3.js';
import { EncryptedKeyData } from '../../../../src/lib/solana/models/EncryptedKeyData';
import { defaultSignCallback } from '../../../../src/lib/wallet';
import { didToPublicKey } from '../../../../src/lib/util';
import {EncryptedKey} from "../../../../src/lib/UserDetails";

const makeDummyUserPubKey = (): Array<number> => Array.from(new Uint8Array(32));
const makeDummyEncryptedKeyData = (): EncryptedKeyData =>
  new EncryptedKey(
    new Uint8Array(8),
    new Uint8Array(24),
    new Uint8Array(16),
    new Uint8Array(32),
    new Uint8Array(32),
  ).toChainData();

describe('Transaction', () => {
  const connection = SolanaUtil.getConnection();
  let payer: Keypair;
  let alice: Keypair;
  let bob: Keypair;

  let aliceDID: string;
  let bobDID: string;

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

    await createDID({
      payer: payer.secretKey,
      owner: alice.publicKey.toBase58(),
    });

    await createDID({
      payer: payer.secretKey,
      owner: bob.publicKey.toBase58(),
    });
  });

  describe('UserDetails', () => {
    it('should create a userDetails account', async () => {
      const dummyUserPubKey = makeDummyUserPubKey();
      const encryptedUserPrivateKeyData = [makeDummyEncryptedKeyData(), makeDummyEncryptedKeyData()];
      await SolariumTransaction.createUserDetails(
        payer.publicKey,
        didToPublicKey(aliceDID),
        alice.publicKey,
        encryptedUserPrivateKeyData,
        dummyUserPubKey,
        defaultSignCallback(payer, alice),
        'alice'
      );
    });
  });
});
