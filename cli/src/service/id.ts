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

export type ExtendedId = {
  document: DIDDocument;
  userDetails?: UserDetails;
};

export const getId = async (): Promise<ExtendedId | null> => {
  const wallet = await getWallet();

  let document;
  try {
    document = await getDID({
      owner: wallet.publicKey.toBase58(),
    });
  } catch (error) {
    // TODO this assumes the error was "did not found"
    return null;
  }

  const userDetails = await getUserDetails({ did: document.id });

  return {
    document,
    userDetails: userDetails || undefined,
  };
};

export const createId = async (alias?: string): Promise<ExtendedId> => {
  const wallet = await getWallet();

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

export const updateId = async (alias: string): Promise<void> => {
  const wallet = await getWallet();

  const extendedId = await getId();

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
