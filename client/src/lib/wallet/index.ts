import {
  Keypair,
  PublicKey,
  SignaturePubkeyPair,
  Transaction,
  TransactionCtorFields,
  TransactionInstruction,
} from '@solana/web3.js';
import { currentCluster, isKeypair } from '../util';
import { ClusterType } from '@identity.com/sol-did-client';
import { SolanaUtil } from '../solana/solanaUtil';
import nacl from 'tweetnacl';
import { uniqWith } from 'ramda';

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
  transactionOpts?: TransactionCtorFields,
  additionalSigners?: Keypair[]
) => Promise<Transaction>;

export const defaultSignCallback = (
  payer: Keypair,
  ...signers: Keypair[]
): SignCallback => async (
  instructions: TransactionInstruction[],
  transactionOpts?: TransactionCtorFields,
  additionalSigners: Keypair[] = []
): Promise<Transaction> => {
  // Remove any duplicates from the list of signers (including the payer)
  // Prefers the first item if two items compare equal based on the predicate.
  const comparator = (a: Keypair, b: Keypair): boolean =>
    a.publicKey.equals(b.publicKey);
  const [, ...uniqueSigners] = uniqWith(comparator, [payer, ...signers]);

  const signerPubkeys: SignaturePubkeyPair[] = uniqueSigners.map(s => ({
    signature: null,
    publicKey: s.publicKey,
  }));
  const transaction = new Transaction({
    ...transactionOpts,
    signatures: signerPubkeys,
    feePayer: payer.publicKey,
  }).add(...instructions);

  if (uniqueSigners.length + additionalSigners.length) {
    transaction.partialSign(...uniqueSigners, ...additionalSigners);
  }

  const message = transaction.serializeMessage();
  const myAccountSignature = nacl.sign.detached(message, payer.secretKey);
  transaction.addSignature(payer.publicKey, Buffer.from(myAccountSignature));

  return transaction;
};

export const defaultSignCallbackFor = (
  payer: Keypair,
  ...potentialSigners: (Keypair | PublicKey)[]
): SignCallback => {
  const signers = potentialSigners.filter(s => isKeypair(s)) as Keypair[];
  return defaultSignCallback(payer, ...signers);
};
