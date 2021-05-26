import {
  create,
  createDirect,
  ExtendedCluster,
  Channel,
  Message,
  post,
  get,
  getDirect,
  readStream,
  addKey as addKeyToDID
} from 'solarium-js'
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {sign} from "../web3/connection";
import {Observable} from "rxjs";

const cluster = process.env.REACT_APP_CLUSTER as ExtendedCluster | undefined;

export const createChannel = (  
  connection: Connection,
  wallet: Wallet,
  name: string
):Promise<Channel> =>
  create({
    name,
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  })

export const createDirectChannel = (
  connection: Connection,
  wallet: Wallet,
  inviteeDID: string,
):Promise<Channel> =>
  createDirect({
    inviteeDID,
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  })

export const getChannel = (
  connection: Connection,
  wallet: Wallet,
  channelAddress: string
):Promise<Channel | null> =>
  get({
    channel: channelAddress,
    cluster
  })

export const getDirectChannel = (
  connection: Connection,
  wallet: Wallet,
  partnerDID: string,
):Promise<Channel | null> =>
  getDirect({
    partnerDID,
    cluster
  })

export const getOrCreateDirectChannel = async (
  connection: Connection,
  wallet: Wallet,
  partnerDID: string,
): Promise<Channel> => {
  const channel = await getDirectChannel(connection, wallet, partnerDID)

  if (channel) return channel;

  return createDirect({
    inviteeDID: partnerDID,
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  });
}

export const getOrCreateChannel = async (
  connection: Connection,
  wallet: Wallet,
  name: string,
  address: string,
): Promise<Channel> => {
  const channel = await getChannel(connection, wallet, address);
  
  if (channel) return channel;

  return create({
    name,
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  });
}

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
    channelsToUpdate: [], // TODO
    payer: wallet.publicKey,
    ownerDID,
    keyIdentifier: 'browser',
    newKey: newKey.toBase58(),
    signCallback: sign(connection, wallet),
    cluster
  });
}

export const postToChannel = (
  connection: Connection,
  wallet: Wallet,
  channel: Channel,
  senderDID: string,
  signer: Keypair,
  message: string
): Promise<void> =>
  post({
    channel: channel.address.toBase58(),
    payer: wallet.publicKey,
    signer: signer.secretKey,
    message,
    signCallback: sign(connection, wallet, signer),
    cluster
  })

export const readChannel = (
  did: string,
  channel: Channel,
  decryptionKey: Keypair,
): Observable<Message> =>
  readStream({
    channel: channel.address.toBase58(),
    memberDID: did,
    decryptionKey: decryptionKey.secretKey,
    cluster
  })
