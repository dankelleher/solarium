import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";

export const post = async (
  message: string,
  toChannel: string,
  id_file?: string
): Promise<void> => {
  const wallet = await getWallet(id_file);

  return solarium.post({
    payer: wallet.secretKey,
    message,
    signer: wallet.secretKey,
    channel: toChannel,
  });
};
