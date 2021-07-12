import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";

export const post = async (
  message: string,
  toChannel: string
): Promise<void> => {
  const wallet = await getWallet();

  return solarium.post({
    payer: wallet.secretKey,
    message,
    signer: wallet.secretKey,
    channel: toChannel,
  });
};
