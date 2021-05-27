import {getWallet} from "../lib/config";
import * as solarium from 'solarium-js';

export const create = async (name: string) => {
  const wallet = await getWallet();

  return solarium.create({
    payer: wallet.secretKey,
    // TODO fix create to add payer private key
    //  (not just the public key) if no owner is specified
    owner: wallet.secretKey,
    name
  })
}
