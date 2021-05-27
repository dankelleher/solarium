import {Connection, Keypair, PublicKey} from '@solana/web3.js';
import {
  debug,
  didToPublicKey,
  ExtendedCluster,
  isKeypair, pubkeyOf,
} from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { get as getDID } from '../lib/did/get';
import { create as createDID } from '../lib/did/create';
import { DIDDocument } from 'did-resolver';
import { defaultSignCallback, SignCallback } from '../lib/wallet';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import {createEncryptedCEK, encryptCEKForDID, generateCEK} from "../lib/crypto/ChannelCrypto";
import {ChannelData} from "../lib/solana/models/ChannelData";
import {resolve} from "@identity.com/sol-did-client";
import {Channel} from "../lib/Channel";
import {get} from "./get";

const getChannel = async (
  owner: Keypair,
  ownerDID: string,
  channelAddress: PublicKey,
  connection: Connection,
  cluster?: ExtendedCluster
): Promise<Channel> => {
  const channel = await get(channelAddress, connection, ownerDID, owner.secretKey, cluster);

  if (!channel) {
    throw new Error('Error retrieving created channel');
  }

  return channel;
}

/**
 * Adds a DID to a channel
 * @param ownerDID
 * @param owner
 * @param payer
 * @param channel
 * @param inviteeDID
 * @param signCallback
 * @param cluster
 */
export const addToChannel = async (
  ownerDID: string,
  owner: Keypair,
  payer: Keypair | PublicKey,
  channel: PublicKey,
  inviteeDID: string,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const createSignedTx =
    signCallback || (isKeypair(payer) && isKeypair(owner) && defaultSignCallback(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const connection = SolanaUtil.getConnection(cluster);
  
  const channelForOwner = await getChannel(owner, ownerDID, channel, connection, cluster);

  const ownerDIDKey = didToPublicKey(ownerDID);
  const inviteeDIDKey = didToPublicKey(inviteeDID);
  
  const inviteeCEKs = await channelForOwner.encryptCEKForDID(inviteeDID);
  
  await SolariumTransaction.addDIDToChannel(
    pubkeyOf(payer),
    channel,
    ownerDIDKey,
    owner.publicKey,
    inviteeDIDKey,
    inviteeCEKs,
    createSignedTx,
    cluster
  );
};
