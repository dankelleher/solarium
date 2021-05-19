import {
  Keypair,
  SignaturePubkeyPair,
  Transaction,
  TransactionCtorFields,
  TransactionInstruction,
} from '@solana/web3.js';
import { currentCluster } from '../util';
import { ClusterType } from '@identity.com/sol-did-client';
import { SolanaUtil } from '../solana/solanaUtil';
import nacl from 'tweetnacl';

export const create = async (): Promise<Keypair> => {
  if (currentCluster() !== ClusterType.mainnetBeta()) {
    // attempt airdrop if we are not on mainnet
    return SolanaUtil.newWalletWithLamports(
      SolanaUtil.getConnection(),
      10_000_000_000
    ); // 10 Sol
  }

  return Keypair.generate();
};

export type SignCallback = (
  instructions: TransactionInstruction[],
  transactionOpts?: TransactionCtorFields
) => Promise<Transaction>;

export const defaultSignCallback = (
  payer: Keypair,
  ...signers: Keypair[]
): SignCallback => async (
  instructions: TransactionInstruction[],
  transactionOpts?: TransactionCtorFields
) => {
  const signerPubkeys: SignaturePubkeyPair[] = signers.map(s => ({
    signature: null,
    publicKey: s.publicKey,
  }));
  const transaction = new Transaction({
    ...transactionOpts,
    signatures: signerPubkeys,
    feePayer: payer.publicKey,
  }).add(...instructions);

  if (signers.length) {
    transaction.partialSign(...signers);
  }

  const message = transaction.serializeMessage();
  const myAccountSignature = nacl.sign.detached(message, payer.secretKey);
  transaction.addSignature(payer.publicKey, Buffer.from(myAccountSignature));

  return transaction;
};
