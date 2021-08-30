import {SolanaUtil} from "../../../../src/lib/solana/solanaUtil";
import { SolariumTransaction } from "../../../../src/lib/solana/transaction";
import {Channel} from "../../../../src";
import {ClusterType, keyToIdentifier} from "@identity.com/sol-did-client";
import {Keypair} from "@solana/web3.js";
import {EncryptedKeyData} from "../../../../src/lib/solana/models/EncryptedKeyData";
import {UserPubKey} from "../../../../src/lib/solana/models/UserDetailsData";


const makeDummyUserKey = ():UserPubKey => {
  return {}
};

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
      const dummyKey = makeDummyUserKey()
      await SolariumTransaction.createUserDetails(
        payer.publicKey,
        aliceDID,
        alice.publicKey,
        [],
        
      )
    })
    
  })
});