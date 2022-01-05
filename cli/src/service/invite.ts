import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";

export const invite = async (
  inviteeDID: string,
  channelAddress: string,
  id_file?: string
): Promise<void> => {
  const wallet = await getWallet(id_file);

  return solarium.addToChannel({
    payer: wallet.secretKey,
    // TODO fix create to add payer private key
    //  (not just the public key) if no decryptionKey is specified
    decryptionKey: wallet.secretKey,
    channel: channelAddress,
    inviteeDID,
  });
};
