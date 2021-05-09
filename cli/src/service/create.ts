import {getWallet} from "../lib/config";
import * as solarium from 'solarium';

export const create = async () => {
  const wallet = getWallet();

  const inbox = await solarium.create({
    payer: wallet.secretKey
  });
}
