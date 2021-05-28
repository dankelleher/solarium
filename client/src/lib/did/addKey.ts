import { resolve, createUpdateInstruction } from '@identity.com/sol-did-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import { defaultSignCallback, SignCallback } from '../wallet';
import { SolariumTransaction } from '../solana/transaction';
import { ExtendedCluster, isKeypair, pubkeyOf } from '../util';

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

  const keyDID = did + '#' + keyIdentifier;

  const existingDoc = await resolve(did);

  const appendedCapabilityInvocation = [
    ...(existingDoc.capabilityInvocation || []),
    keyDID,
  ];

  const instruction = await createUpdateInstruction({
    identifier: did,
    authority: pubkeyOf(signer),
    mergeBehaviour: 'Append',
    document: {
      verificationMethod: [
        {
          id: keyDID,
          type: 'Ed25519VerificationKey2018',
          controller: did,
          publicKeyBase58: key.toBase58(),
        },
      ],
      capabilityInvocation: appendedCapabilityInvocation,
    },
  });

  await SolariumTransaction.signAndSendTransaction(
    [instruction],
    createSignedTx,
    [],
    cluster
  );

  return resolve(did);
};
