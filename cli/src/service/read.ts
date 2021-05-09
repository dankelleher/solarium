import {getWallet} from "../lib/config";
import * as solarium from 'solarium';
import {Message} from "solarium";

export const read = async ():Promise<Message[]> => {
  const wallet = getWallet();

  return solarium.read({
    ownerKey: wallet.secretKey,
  });
}

export const readStream = () => {
  const wallet = getWallet();

  return solarium.readStream({
    ownerKey: wallet.secretKey,
  });
}
