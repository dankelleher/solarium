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
  addKey as addKeyToDID,
  addToChannel as addDIDToChannel
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
  channelAddress: string,
  decryptionKey?: Keypair,
):Promise<Channel | null> =>
  get({
    channel: channelAddress,
    cluster,
    decryptionKey: decryptionKey?.secretKey
  })

export const getDirectChannel = (
  connection: Connection,
  wallet: Wallet,
  partnerDID: string,
  decryptionKey?: Keypair,
):Promise<Channel | null> =>
  getDirect({
    partnerDID,
    cluster,
    decryptionKey: decryptionKey?.secretKey
  })

export const getOrCreateDirectChannel = async (
  connection: Connection,
  wallet: Wallet,
  partnerDID: string,
  decryptionKey?: Keypair,
): Promise<Channel> => {
  const channel = await getDirectChannel(connection, wallet, partnerDID, decryptionKey)

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
  decryptionKey?: Keypair,
): Promise<Channel> => {
  const channel = await getChannel(connection, wallet, address, decryptionKey);

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
  decryptionKey: Keypair,
  newKey: PublicKey,
  ownerDID?: string,
):Promise<void> => {
  console.log("Adding key", {
    newKey: newKey.toBase58(),
    ownerDID,
    payer: wallet.publicKey.toBase58()
  });
  await addKeyToDID({
    signer: decryptionKey.secretKey,
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

export const addToChannel = (
  connection: Connection,
  wallet: Wallet,
  channel: Channel,
  inviteAuthority: Keypair,
  did: string,
  inviteeDID: string
) => addDIDToChannel({
  channel: channel.address.toBase58(),
  decryptionKey: inviteAuthority.secretKey,
  inviteeDID,
  payer: wallet.publicKey,
  signCallback: sign(connection, wallet),
  cluster
})