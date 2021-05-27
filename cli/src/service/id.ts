import {createDID, getDID} from "solarium-js";
import {getWallet} from "../lib/config";

// TODO import DIDDocument
export const getId = async ():Promise<any> => {
  const wallet = await getWallet();

  return getDID({
    owner: wallet.publicKey.toBase58(),
  });
}

export const createId = async ():Promise<any> => {
  const wallet = await getWallet();

  return createDID({
    payer: wallet.secretKey
  });
}
