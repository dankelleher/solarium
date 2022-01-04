import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";

export const addKey = async (
  keyIdentifier: string,
  newKey: string,
  id_file?: String
): Promise<void> => {
  const wallet = await getWallet(id_file);

  await solarium.addKey({
    payer: wallet.secretKey,
    signer: wallet.secretKey,
    keyIdentifier,
    newKey,
    channelsToUpdate: [], // TODO add addressbook
  });
};
