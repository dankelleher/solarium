import {getWallet} from "../lib/config";
import * as solarium from 'solarium-js';

export const addKey = async (keyIdentifier: string, newKey: string) => {
  const wallet = await getWallet();

  await solarium.addKey({
    payer: wallet.secretKey,
    keyIdentifier,
    newKey,
    channelsToUpdate: [] // TODO add addressbook
  })
}
