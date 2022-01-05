import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";
import { Message } from "solarium-js";
import { Keypair } from "@solana/web3.js";
import { switchMap } from "rxjs/operators";
import { from, Observable } from "rxjs";

export const read = async (
  channelAddress: string,
  id_file?: string
): Promise<Message[]> => {
  const wallet = await getWallet(id_file);

  return solarium.read({
    channel: channelAddress,
    decryptionKey: wallet.secretKey,
  });
};

export const readStream = (
  channelAddress: string,
  id_file?: string
): Observable<Message> => {
  const wallet$ = from(getWallet(id_file));

  return wallet$.pipe(
    switchMap(
      (wallet: Keypair): Observable<Message> =>
        solarium.readStream({
          channel: channelAddress,
          decryptionKey: wallet.secretKey,
        })
    )
  );
};
