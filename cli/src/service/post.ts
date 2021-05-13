import {getWallet} from "../lib/config";
import * as solarium from 'solarium-js';

export const post = async (message: string, to: string) => {
  const wallet = await getWallet();

  return solarium.post({
    payer: wallet.secretKey,
    message,
    ownerDID: to
  })
}
