import {
  createRegisterInstruction,
  DecentralizedIdentifier,
  resolve,
} from '@identity.com/sol-did-client';
import {Keypair, PublicKey} from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import {currentCluster, ExtendedCluster, isKeypair, pubkeyOf} from '../util';
import {defaultSignCallback, SignCallback} from '../wallet';
import { SolariumTransaction } from '../solana/transaction';

export const create = async (
  owner: PublicKey,
  payer: Keypair | PublicKey,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  const createSignedTx =
    signCallback || (isKeypair(payer) && defaultSignCallback(payer));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');
  
  const [instruction, didKey] = await createRegisterInstruction({
    payer: pubkeyOf(payer),
    authority: owner,
  });

  await SolariumTransaction.signAndSendTransaction(
    [instruction],
    createSignedTx,
    [],
    cluster
  );

  const did = DecentralizedIdentifier.create(
    didKey,
    currentCluster(cluster)
  ).toString();

  return resolve(did);
};
