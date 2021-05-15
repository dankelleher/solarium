import {create, Inbox, Message, post, readStream} from 'solarium-js'
import {Connection, Keypair} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {sign} from "../web3/connection";
import {Observable} from "rxjs";

export const createInbox = (
  connection: Connection,
  wallet: Wallet
):Promise<Inbox> =>
  create({
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet)
  })

export const postToInbox = (
  connection: Connection,
  wallet: Wallet,
  senderDID: string,
  signer: Keypair,
  recipientDID: string,
  message: string
): Promise<void> =>
  post({
    payer: wallet.publicKey,
    ownerDID: recipientDID,
    signer: signer.secretKey,
    message,
    signCallback: sign(connection, wallet)
  })

export const read = (
  wallet: Wallet,
  decryptionKey: Keypair,
): Observable<Message> => {
  return readStream({
    owner: wallet.publicKey.toBase58(),
    decryptionKey: decryptionKey.secretKey
  });
}