import { createUpdateInstruction } from '@identity.com/sol-did-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import { defaultSignCallback, SignCallback } from '../wallet';
import { SolariumTransaction } from '../solana/transaction';
import {
  ExtendedCluster,
  isKeypair,
  keyToVerificationMethod,
  pubkeyOf,
} from '../util';
import { getDocument } from './get';

export const addKey = async (
  did: string,
  keyIdentifier: string,
  key: PublicKey,
  signer: Keypair | PublicKey,
  payer?: Keypair,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  // if a signCallback is not specified, both the payer and signer private keys need to be provided
  const createSignedTx =
    signCallback ||
    (payer && isKeypair(signer) && defaultSignCallback(payer, signer));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const existingDoc = await getDocument(did);

  const keyVerificationMethod = keyToVerificationMethod(did, {
    identifier: keyIdentifier,
    key: key.toBase58(),
  });

  const appendedCapabilityInvocation = [
    ...(existingDoc.capabilityInvocation || []),
    keyVerificationMethod.id,
  ];

  const instruction = await createUpdateInstruction({
    identifier: did,
    authority: pubkeyOf(signer),
    mergeBehaviour: 'Append',
    document: {
      verificationMethod: [keyVerificationMethod],
      capabilityInvocation: appendedCapabilityInvocation,
    },
  });

  await SolariumTransaction.signAndSendTransaction(
    [instruction],
    createSignedTx,
    [],
    cluster
  );

  return getDocument(did, true);
};
