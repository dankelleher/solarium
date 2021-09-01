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
  DIDKey,
  ExtendedCluster,
  isKeypair,
  keyToVerificationMethod,
  pubkeyOf,
} from '../util';
import { defaultSignCallbackFor, SignCallback } from '../wallet';
import { SolariumTransaction } from '../solana/transaction';
import { createUserDetails } from '../solana/instruction';
import { getDocument } from './get';
import { pluck } from 'ramda';
import {makeUserKeyPair, makeUserKeyPairForKeys} from "../crypto/UserAccountCrypto";

const makeDocumentForKeys = (
  did: string,
  additionalKeys?: DIDKey[]
): Partial<DIDDocument> | undefined => {
  if (!additionalKeys) return undefined;

  const keyVerificationMethods = additionalKeys.map(key =>
    keyToVerificationMethod(did, key)
  );

  const capabilityInvocation = [
    `${did}#default`, // TODO expose DEFAULT_KEY_ID from sol-did
    ...pluck('id', keyVerificationMethods),
  ];

  return {
    verificationMethod: keyVerificationMethods,
    capabilityInvocation,
  };
};

export const create = async (
  owner: Keypair | PublicKey,
  payer: Keypair | PublicKey,
  alias?: string,
  additionalKeys?: DIDKey[],
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  const createSignedTx =
    signCallback || (isKeypair(payer) && defaultSignCallbackFor(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const didForAuthority = await keyToIdentifier(
    pubkeyOf(owner),
    currentCluster(cluster)
  );

  const document = makeDocumentForKeys(didForAuthority, additionalKeys);

  const [registerInstruction, didKey] = await createRegisterInstruction({
    payer: pubkeyOf(payer),
    authority: pubkeyOf(owner),
    document,
  });

  const instructions = [registerInstruction];
  if (alias) {
    debug('Creating user-details for the new DID: ' + didForAuthority);

    const userKeyPair = await makeUserKeyPairForKeys([pubkeyOf(owner).toBase58()]);

    // TODO @martin there is duplication here with service/userDetails.ts createUserDetails
    // this function bundles the DID creation with userDetails creation into a single
    // TX, whereas createUserDetails is used to add a userDetails account to an existing
    // DID. So it makes sense that both exist, but perhaps we can do something about the
    // code duplication.
    const encryptedUserPrivateKeyData = userKeyPair.encryptedPrivateKeys.map(
      key => key.toChainData()
    );
    const createUserDetailsInstruction = await createUserDetails(
      pubkeyOf(payer),
      didKey,
      pubkeyOf(owner),
      alias,
      encryptedUserPrivateKeyData,
      Array.from(userKeyPair.userPubKey),
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
