import {
  createRegisterInstruction,
  DecentralizedIdentifier,
  keyToIdentifier,
} from '@identity.com/sol-did-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import {
  currentCluster,
  debug,
  didToPublicKey,
  ExtendedCluster,
  isKeypair,
  pubkeyOf,
} from '../util';
import { defaultSignCallbackFor, SignCallback } from '../wallet';
import { SolariumTransaction } from '../solana/transaction';
import { createUserDetails } from '../solana/instruction';
import { getDocument } from './get';

export const create = async (
  owner: Keypair | PublicKey,
  payer: Keypair | PublicKey,
  alias?: string,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  const createSignedTx =
    signCallback || (isKeypair(payer) && defaultSignCallbackFor(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const [registerInstruction, didKey] = await createRegisterInstruction({
    payer: pubkeyOf(payer),
    authority: pubkeyOf(owner),
  });

  const instructions = [registerInstruction];
  if (alias) {
    const didForAuthority = await keyToIdentifier(
      pubkeyOf(owner),
      currentCluster(cluster)
    );
    const didKey = didToPublicKey(didForAuthority);

    debug('Creating user-details for the new DID: ' + didForAuthority);
    const createUserDetailsInstruction = await createUserDetails(
      pubkeyOf(payer),
      didKey,
      pubkeyOf(owner),
      alias
    );
    instructions.push(createUserDetailsInstruction);
  }

  await SolariumTransaction.signAndSendTransaction(
    instructions,
    createSignedTx,
    [],
    cluster
  );

  const did = DecentralizedIdentifier.create(
    didKey,
    currentCluster(cluster)
  ).toString();

  return getDocument(did, true);
};
