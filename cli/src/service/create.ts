import {getWallet} from "../lib/config";
import * as solarium from 'solarium';

export const create = async () => {
  const wallet = getWallet();

  return solarium.create({
    payer: wallet.secretKey
  })
}
