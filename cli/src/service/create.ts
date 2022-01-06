import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";
import { Channel } from "solarium-js";

export const create = async (
  name: string,
  id_file?: string
): Promise<Channel> => {
  const wallet = await getWallet(id_file);

  return solarium.create({
    payer: wallet.secretKey,
    // TODO fix create to add payer private key
    //  (not just the public key) if no owner is specified
    owner: wallet.secretKey,
    name,
  });
};
