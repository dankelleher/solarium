import { createDID, getDID, getUserDetails, UserDetails } from "solarium-js";
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
