import {
  createRegisterInstruction,
  DecentralizedIdentifier,
  resolve,
} from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import { currentCluster, ExtendedCluster } from '../util';
import { SignCallback } from '../wallet';
import { SolariumTransaction } from '../solana/transaction';

export const create = async (
  owner: PublicKey,
  payer: PublicKey,
  signCallback: SignCallback,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  const [instruction, didKey] = await createRegisterInstruction({
    payer,
    authority: owner,
  });

  await SolariumTransaction.signAndSendTransaction(
    [instruction],
    signCallback,
    [],
    cluster
  );

  const did = DecentralizedIdentifier.create(
    didKey,
    currentCluster(cluster)
  ).toString();

  return resolve(did);
};
