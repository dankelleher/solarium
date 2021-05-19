import {
  create,
  ExtendedCluster,
  Inbox,
  Message,
  post,
  get as getInbox,
  readStream,
  addKey as addKeyToDID,
  keyToIdentifier
} from 'solarium-js'
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {sign} from "../web3/connection";
import {Observable} from "rxjs";

const cluster = process.env.REACT_APP_CLUSTER as ExtendedCluster | undefined;

export const createInbox = (  
  connection: Connection,
  wallet: Wallet
):Promise<Inbox> =>
  create({
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  })

export const addKey = async (
  connection: Connection,
  wallet: Wallet,
  newKey: PublicKey,
  ownerDID?: string,
):Promise<void> => {
  console.log("Adding key", {
    newKey: newKey.toBase58(),
    ownerDID,
    payer: wallet.publicKey.toBase58()
  });
  await addKeyToDID({
    payer: wallet.publicKey,
    ownerDID,
    keyIdentifier: 'browser',
    newKey: newKey.toBase58(),
    signCallback: sign(connection, wallet),
    cluster
  });
}

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
    signCallback: sign(connection, wallet, signer),
    cluster
  })

export const get = async (
  did: string
): Promise<Inbox | null> => {
  console.log(`Getting inbox for ${did}`);
  const inbox = await getInbox({
    ownerDID: did,
    cluster
  });

  console.log("Got inbox", inbox);
  return inbox;
}

export const read = (
  did: string,
  decryptionKey: Keypair,
): Observable<Message> =>
  readStream({
    ownerDID: did,
    decryptionKey: decryptionKey.secretKey,
    cluster
  })