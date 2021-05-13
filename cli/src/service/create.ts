import {getWallet} from "../lib/config";
import * as solarium from 'solarium-js';

export const create = async () => {
  const wallet = await getWallet();

  return solarium.create({
    payer: wallet.secretKey
  })
}
