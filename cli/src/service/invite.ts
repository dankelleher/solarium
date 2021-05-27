import {getWallet} from "../lib/config";
import * as solarium from 'solarium-js';

export const create = async (channelAddress: string, inviteeDID: string) => {
  const wallet = await getWallet();

  return solarium.addToChannel({
    payer: wallet.secretKey,
    // TODO fix create to add payer private key
    //  (not just the public key) if no decryptionKey is specified
    decryptionKey: wallet.secretKey,
    channel: channelAddress,
    inviteeDID
  })
}
