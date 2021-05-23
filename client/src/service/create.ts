import { Keypair, PublicKey } from '@solana/web3.js';
import {
  didToPublicKey,
  ExtendedCluster,
  isKeypair,
  pubkeyOf,
} from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { get as getDID } from '../lib/did/get';
import { create as createDID } from '../lib/did/create';
import { DIDDocument } from 'did-resolver';
import { defaultSignCallback, SignCallback } from '../lib/wallet';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import {createEncryptedCEK} from "../lib/crypto/ChannelCrypto";
import {ChannelData} from "../lib/solana/models/ChannelData";

/**
 * If a DID was already registered for this owner, return its document. Else create one
 * @param owner
 * @param payer
 * @param signCallback
 * @param cluster
 */
const getOrCreateDID = async (
  owner: PublicKey,
  payer: Keypair | PublicKey,
  signCallback: SignCallback,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  try {
    console.log(`Looking for a DID owned by ${owner.toBase58()}`);
    return await getDID(owner, cluster);
  } catch (error) {
    if (error.message.startsWith('No DID found')) {
      console.log('No DID found - creating...');

      return createDID(owner, pubkeyOf(payer), signCallback, cluster);
    }
    throw error;
  }
};

/**
 * Creates an inbox
 * @param owner
 * @param payer
 * @param name
 * @param signCallback
 * @param cluster
 */
export const createChannel = async (
  owner: PublicKey,
  payer: Keypair | PublicKey,
  name: string,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<ChannelData> => {
  const createSignedTx =
    signCallback || (isKeypair(payer) && defaultSignCallback(payer));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const didForOwner = await getOrCreateDID(
    owner,
    payer,
    createSignedTx,
    cluster
  );
  const didKey = didToPublicKey(didForOwner.id);
  
  const ceks = await createEncryptedCEK(didForOwner.id);
  
  const connection = SolanaUtil.getConnection(cluster);

  const channelAddress = await SolariumTransaction.createGroupChannel(
    connection,
    pubkeyOf(payer),
    didKey,
    owner,
    name,
    ceks,
    createSignedTx,
    cluster
  );

  const channel = await SolariumTransaction.getChannelData(connection, channelAddress);

  if (!channel) {
    throw new Error('Error retrieving created channel');
  }

  return channel;
};
