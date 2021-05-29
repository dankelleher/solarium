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
  addToChannel as addDIDToChannel,
  createDID,
  airdrop
} from 'solarium-js'
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {sign} from "../web3/connection";
import {Observable} from "rxjs";
import {MIN_BALANCE} from "../constants";

export const cluster = process.env.REACT_APP_CLUSTER as ExtendedCluster | undefined;

export const airdropIfNeeded = async (
  connection: Connection,
  wallet: Wallet
):Promise<void> => {
  const balance = await connection.getBalance(wallet.publicKey)

  if (balance < MIN_BALANCE) {
    console.log("Airdropping...");
    await airdrop(
      connection,
      wallet.publicKey,
      MIN_BALANCE * 2
    )
  }
};

const withAirdrop = <T extends Array<any>, U>(fn: (...args: T) => Promise<U>) => {
  return async (...args: T): Promise<U> => {
    await airdropIfNeeded(args[0], args[1]);
    return fn(...args)
  }
}

export const createChannel = withAirdrop((
  connection: Connection,
  wallet: Wallet,
  name: string
):Promise<Channel> =>
  create({
    name,
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  }))

export const createDirectChannel = withAirdrop((
  connection: Connection,
  wallet: Wallet,
  inviteeDID: string,
):Promise<Channel> =>
  createDirect({
    inviteeDID,
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  }))

export const getChannel = (
  connection: Connection,
  wallet: Wallet,
  ownerDID: string,
  channelAddress: string,
  decryptionKey?: Keypair,
):Promise<Channel | null> =>
  get({
    channel: channelAddress,
    ownerDID,
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

export const getOrCreateDirectChannel = withAirdrop(async (
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
})

export const getOrCreateChannel = withAirdrop(async (
  connection: Connection,
  wallet: Wallet,
  did: string,
  name: string,
  address: string,
  decryptionKey?: Keypair,
): Promise<Channel> => {
  const channel = await getChannel(connection, wallet, did, address, decryptionKey);

  if (channel) return channel;

  return create({
    name,
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster
  });
})

export const addKey = withAirdrop(async (
  connection: Connection,
  wallet: Wallet,
  newKey: PublicKey,
  ownerDID?: string,
  decryptionKey?: Keypair,
  channelsToUpdate: Channel[] = [] // TODO
):Promise<void> => {
  console.log("Adding key", {
    newKey: newKey.toBase58(),
    ownerDID,
    payer: wallet.publicKey.toBase58()
  });

  if (channelsToUpdate.length > 0 && !decryptionKey) {
    throw new Error("Decryption key required to update channels with new key")
  }

  await addKeyToDID({
    signer: decryptionKey?.secretKey || wallet.publicKey,
    channelsToUpdate: channelsToUpdate.map(c => c.address.toBase58()),
    payer: wallet.publicKey,
    ownerDID,
    keyIdentifier: 'browser',
    newKey: newKey.toBase58(),
    signCallback: sign(connection, wallet),
    cluster
  });
});

export const postToChannel = withAirdrop((
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
  }))

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

export const addToChannel = withAirdrop((
  connection: Connection,
  wallet: Wallet,
  channelAddress: string,
  inviteAuthority: Keypair,
  inviteeDID: string
) => addDIDToChannel({
  channel: channelAddress,
  decryptionKey: inviteAuthority.secretKey,
  inviteeDID,
  payer: wallet.publicKey,
  signCallback: sign(connection, wallet),
  cluster
}));

export const createIdentity = withAirdrop((
  connection: Connection,
  wallet: Wallet
) =>
  createDID({
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    cluster,
  }))
