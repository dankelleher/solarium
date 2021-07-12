import { createDID, getDID } from "solarium-js";
import { DIDDocument } from "did-resolver";
import { getWallet } from "../lib/config";

export const getId = async (): Promise<DIDDocument> => {
  const wallet = await getWallet();

  return getDID({
    owner: wallet.publicKey.toBase58(),
  });
};

export const createId = async (): Promise<DIDDocument> => {
  const wallet = await getWallet();

  return createDID({
    payer: wallet.secretKey,
  });
};
