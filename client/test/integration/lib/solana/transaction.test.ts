import { SolanaUtil } from '../../../../src/lib/solana/solanaUtil';
import { SolariumTransaction } from '../../../../src/lib/solana/transaction';
import { Channel } from '../../../../src';
import { ClusterType, keyToIdentifier } from '@identity.com/sol-did-client';
import { Keypair } from '@solana/web3.js';
import { EncryptedKeyData } from '../../../../src/lib/solana/models/EncryptedKeyData';
import { UserPubKey } from '../../../../src/lib/solana/models/UserDetailsData';
import { defaultSignCallback } from '../../../../src/lib/wallet';
import { didToPublicKey } from '../../../../src/lib/util';

const makeDummyUserPubKey = (): UserPubKey => Uint8Array.of(32);
const makeDummyEncryptedKeyData = (): EncryptedKeyData =>
  new EncryptedKeyData({
    kid: Uint8Array.of(8),
    kiv: Uint8Array.of(24),
    keyTag: Uint8Array.of(16),
    ephemeralPubkey: Uint8Array.of(32),
    keyCiphertext: Uint8Array.of(32),
  });

describe('Transaction', () => {
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

  describe('UserDetails', () => {
    it('should create a userDetails account', async () => {
      const dummyUserPubKey = makeDummyUserPubKey();
      await SolariumTransaction.createUserDetails(
        payer.publicKey,
        didToPublicKey(aliceDID),
        alice.publicKey,
        [makeDummyEncryptedKeyData(), makeDummyEncryptedKeyData()],
        dummyUserPubKey,
        defaultSignCallback(payer, alice),
        'alice'
      );
    });
  });
});
