import {
  createDID,
  getDID,
  createUserDetails,
  getUserDetails,
  updateUserDetails,
  UserDetails,
} from "solarium-js";
import { DIDDocument } from "did-resolver";
import { getWallet } from "../lib/config";
import {debug} from '../lib/util';
import {
  ClusterType,
  keyToIdentifier,
  PrivateKey,
} from '@identity.com/sol-did-client';

export type ExtendedId = {
  document: DIDDocument;
  userDetails?: UserDetails;
};

export const getId = async (id_file? : String): Promise<ExtendedId | null> => {
  const wallet = await getWallet(id_file);

  const identifier = await keyToIdentifier(wallet.publicKey, ClusterType.development())

  debug(`getId wallet.publicKey=${wallet.publicKey.toBase58()}, identifier=${identifier}`)

  let document;
  try {
    document = await getDID({
      owner: wallet.publicKey.toBase58(),
    });
  } catch (error) {
    debug(`getId error=${error}`)
    // TODO this assumes the error was "did not found"
    return null;
  }

  const userDetails = await getUserDetails({ did: document.id });

  return {
    document,
    userDetails: userDetails || undefined,
  };
};

export const createId = async (alias?: string, id_file?: string): Promise<ExtendedId> => {
  const wallet = await getWallet(id_file);

  const document = await createDID({
    payer: wallet.secretKey,
    alias,
  });

  const userDetails = await getUserDetails({ did: document.id });

  return {
    document,
    userDetails: userDetails || undefined,
  };
};

export const updateId = async (alias: string, id_file?: string): Promise<void> => {
  const wallet = await getWallet(id_file);

  const extendedId = await getId(id_file);

  if (!extendedId)
    throw new Error("User has no DID - create it first with solarium id -c");

  const request = {
    payer: wallet.secretKey,
    // TODO fix the service functions to add payer private key
    //  (not just the public key) if no owner is specified
    owner: wallet.secretKey,
    alias,
  };

  if (!extendedId.userDetails) {
    // the DID has no user details account - create it
    await createUserDetails(request);
  } else {
    await updateUserDetails(request);
  }
};
