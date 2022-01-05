import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";
import { Observable } from "rxjs";
import { Channel, Message } from "solarium-js";
import { Keypair } from "@solana/web3.js";

async function getOrCreateDirectChannel(
  wallet: Keypair,
  withDID: string
): Promise<Channel> {
  try {
    return (await solarium.getDirect({
      decryptionKey: wallet.secretKey,
      partnerDID: withDID,
      // TODO fix getDirect return type - atm it throws an error if channel is not found
      // so it should not have type Channel | null
    })) as Channel;
  } catch (error) {
    if (error.message === "Channel not found") {
      return solarium.createDirect({
        payer: wallet.secretKey,
        // TODO fix createDirect to add payer private key
        //  (not just the public key) if no owner is specified
        owner: wallet.secretKey,
        inviteeDID: withDID,
      });
    } else {
      throw error;
    }
  }
}

export const chat = async (
  withDID: string,
  incomingMessages: Observable<string>,
  id_file?: string
): Promise<Observable<Message>> => {
  const wallet = await getWallet(id_file);
  const channel = await getOrCreateDirectChannel(wallet, withDID);

  const channelAddress = channel.address.toBase58();

  incomingMessages.subscribe((message) => {
    return solarium.post({
      payer: wallet.secretKey,
      message,
      signer: wallet.secretKey,
      channel: channelAddress,
    });
  });

  return solarium.readStream({
    channel: channelAddress,
    decryptionKey: wallet.secretKey,
  });
};
