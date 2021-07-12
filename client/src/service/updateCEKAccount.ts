import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  debug,
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
import { Channel } from '../lib/Channel';
import { get } from './get';
import { findVerificationMethodForKey } from '../lib/crypto/ChannelCrypto';
import { resolve } from '@identity.com/sol-did-client';

/**
 * If a DID was already registered for this owner, return its document. Else create one
 * @param owner
 * @param payer
 * @param signCallback
 * @param cluster
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getOrCreateDID = async (
  owner: PublicKey,
  payer: Keypair | PublicKey,
  signCallback: SignCallback,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  try {
    debug(`Looking for a DID owned by ${owner.toBase58()}`);
    return await getDID(owner, cluster);
  } catch (error) {
    if (error.message.startsWith('No DID found')) {
      debug('No DID found - creating...');

      return createDID(owner, pubkeyOf(payer), signCallback, cluster);
    }
    throw error;
  }
};

const getChannel = async (
  owner: Keypair,
  ownerDID: string,
  channelAddress: PublicKey,
  connection: Connection,
  cluster?: ExtendedCluster
): Promise<Channel> => {
  const channel = await get(
    channelAddress,
    connection,
    ownerDID,
    owner.secretKey,
    cluster
  );

  if (!channel) {
    throw new Error('Error retrieving created channel');
  }

  return channel;
};

/**
 * Adds a key to a CEK account for a channel
 * @param ownerDID
 * @param owner
 * @param payer
 * @param channel
 * @param newKey
 * @param signCallback
 * @param cluster
 */
export const updateCEKAccount = async (
  ownerDID: string,
  owner: Keypair,
  payer: Keypair | PublicKey,
  channel: PublicKey,
  newKey: PublicKey,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const connection = SolanaUtil.getConnection(cluster);
  const createSignedTx =
    signCallback ||
    (isKeypair(payer) && isKeypair(owner) && defaultSignCallback(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const ownerDIDDocument = await resolve(ownerDID);
  const didKey = didToPublicKey(ownerDID);

  const foundVerificationMethod = findVerificationMethodForKey(
    ownerDIDDocument,
    newKey
  );

  if (!foundVerificationMethod)
    throw new Error('New key was not found on the DID');

  const channelObject = await getChannel(
    owner,
    ownerDID,
    channel,
    connection,
    cluster
  );
  const newCEK = await channelObject.encryptCEK(foundVerificationMethod);

  await SolariumTransaction.addCEKToAccount(
    channel,
    didKey,
    pubkeyOf(owner),
    newCEK,
    createSignedTx,
    cluster
  );
};
