import { getWallet } from "../lib/config";
import * as solarium from "solarium-js";
import { Message } from "solarium-js";
import { Keypair } from "@solana/web3.js";
import { switchMap } from "rxjs/operators";
import { from, Observable } from "rxjs";

export const read = async (channelAddress: string): Promise<Message[]> => {
  const wallet = await getWallet();

  return solarium.read({
    channel: channelAddress,
    decryptionKey: wallet.secretKey,
  });
};

export const readStream = (channelAddress: string): Observable<Message> => {
  const wallet$ = from(getWallet());

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
