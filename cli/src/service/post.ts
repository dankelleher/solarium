import {getWallet} from "../lib/config";
import * as solarium from 'solarium';

export const post = async (message: string, to: string) => {
  const wallet = getWallet();

  return solarium.post({
    payer: wallet.secretKey,
    message,
    ownerDID: to
  })
}
