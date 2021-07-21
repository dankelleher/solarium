import * as solarium from 'solarium-js'
import {Channel, Message} from 'solarium-js';
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {DEFAULT_ENDPOINT_INDEX, sign} from "../web3/connection";
import {Observable} from "rxjs";
import {ENDPOINTS, MIN_BALANCE} from "../constants";

const cluster = ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name;

export const airdropIfNeeded = async (
  connection: Connection,
  wallet: Wallet
):Promise<void> => {
  const balance = await connection.getBalance(wallet.publicKey)

  if (balance < MIN_BALANCE) {
    console.log("Airdropping...");
    await solarium.airdrop(
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
  solarium.create({
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
  solarium.createDirect({
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
  solarium.get({
    channel: channelAddress,
    ownerDID,
    cluster,
    decryptionKey: decryptionKey?.secretKey
  })

export const getDirectChannel = async (
  connection: Connection,
  wallet: Wallet,
  partnerDID: string,
  decryptionKey?: Keypair,
):Promise<Channel | null> => {
  // TODO handle null case in client
  try {
    return await solarium.getDirect({
      owner: wallet.publicKey.toBase58(),
      partnerDID,
      cluster,
      decryptionKey: decryptionKey?.secretKey
    })
  } catch (error) {
    if (error.message === 'Channel not found') return null;
    throw error;
  }
}

export const getOrCreateDirectChannel = withAirdrop(async (
  connection: Connection,
  wallet: Wallet,
  partnerDID: string,
  decryptionKey?: Keypair,
): Promise<Channel> => {
  const channel = await getDirectChannel(connection, wallet, partnerDID, decryptionKey)
  
  if (channel) return channel;

  return solarium.createDirect({
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

  return solarium.create({
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

  const signCallback = decryptionKey ? sign(connection, wallet, decryptionKey) : sign(connection, wallet);
  await solarium.addKey({
    signer: decryptionKey?.secretKey || wallet.publicKey,
    channelsToUpdate: channelsToUpdate.map(c => c.address.toBase58()),
    payer: wallet.publicKey,
    ownerDID,
    keyIdentifier: 'browser',
    newKey: newKey.toBase58(),
    signCallback,
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
  solarium.post({
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
  solarium.readStream({
    channel: channel.address.toBase58(),
    memberDID: did,
    decryptionKey: decryptionKey.secretKey,
    cluster
  })

export const addToChannel = withAirdrop((
  connection: Connection,
  wallet: Wallet,
  did: string | undefined,
  channelAddress: string,
  inviteAuthority: Keypair,
  inviteeDID: string
) => solarium.addToChannel({
  channel: channelAddress,
  decryptionKey: inviteAuthority.secretKey,
  ownerDID: did,
  inviteeDID,
  payer: wallet.publicKey,
  signCallback: sign(connection, wallet, inviteAuthority),
  cluster
}));

export const createIdentity = withAirdrop((
  connection: Connection,
  wallet: Wallet,
  alias?: string
) =>
  solarium.createDID({
    payer: wallet.publicKey,
    alias,
    signCallback: sign(connection, wallet),
    cluster,
  }))

export const getUserDetails = (did: string) => solarium.getUserDetails({
  did,
  cluster
});

export const createUserDetails = (
  connection: Connection,
  wallet: Wallet,
  did: string,
  alias: string
  ) => {
  return solarium.createUserDetails({
    payer: wallet.publicKey,
    signCallback: sign(connection, wallet),
    ownerDID: did,
    alias,
    cluster
  })
}
