import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  debug,
  didToPublicKey,
  ExtendedCluster,
  isKeypair,
  pubkeyOf,
} from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { get as getDID, getDocument } from '../lib/did/get';
import { create as createDID } from '../lib/did/create';
import { DIDDocument } from 'did-resolver';
import {
  defaultSignCallback,
  defaultSignCallbackFor,
  SignCallback,
} from '../lib/wallet';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import {
  createEncryptedCEK,
  encryptCEKForDID,
  generateCEK,
} from '../lib/crypto/ChannelCrypto';
import { Channel } from '../lib/Channel';
import { get } from './get';

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
    debug(`Looking for a DID owned by ${owner.toBase58()}`);
    return await getDID(owner, cluster);
  } catch (error) {
    if (error.message.startsWith('No DID found')) {
      debug('No DID found - creating...');

      return createDID(
        owner,
        pubkeyOf(payer),
        undefined,
        undefined,
        signCallback,
        cluster
      );
    }
    throw error;
  }
};

const getChannel = async (
  owner: Keypair | PublicKey,
  ownerDID: string,
  channelAddress: PublicKey,
  connection: Connection,
  cluster?: ExtendedCluster
): Promise<Channel> => {
  const ownerKey = isKeypair(owner) ? owner.secretKey : undefined;
  const channel = await get(
    channelAddress,
    connection,
    ownerDID,
    ownerKey,
    cluster
  );

  if (!channel) {
    throw new Error('Error retrieving created channel');
  }

  return channel;
};

/**
 * Creates a group channel
 * @param owner
 * @param payer
 * @param name
 * @param signCallback
 * @param cluster
 */
export const createChannel = async (
  owner: Keypair | PublicKey,
  payer: Keypair | PublicKey,
  name: string,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<Channel> => {
  const createSignedTx =
    signCallback ||
    (isKeypair(payer) &&
      isKeypair(owner) &&
      defaultSignCallbackFor(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const ownerDIDDocument = await getOrCreateDID(
    pubkeyOf(owner),
    payer,
    createSignedTx,
    cluster
  );
  const didKey = didToPublicKey(ownerDIDDocument.id);

  const cek = await createEncryptedCEK(ownerDIDDocument.id);

  const connection = SolanaUtil.getConnection(cluster);

  const channelAddress = await SolariumTransaction.createGroupChannel(
    connection,
    pubkeyOf(payer),
    didKey,
    pubkeyOf(owner),
    name,
    cek.toChainData(),
    createSignedTx,
    cluster
  );

  return getChannel(
    owner,
    ownerDIDDocument.id,
    channelAddress,
    connection,
    cluster
  );
};

/**
 * Creates a direct channel between two DIDs
 * @param owner
 * @param payer
 * @param inviteeDID
 * @param signCallback
 * @param cluster
 */
export const createDirectChannel = async (
  owner: Keypair | PublicKey,
  payer: Keypair | PublicKey,
  inviteeDID: string,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<Channel> => {
  const createSignedTx =
    signCallback ||
    (isKeypair(payer) && isKeypair(owner) && defaultSignCallback(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  // Create the owner DID if it doesn't exist
  const ownerPubKey = pubkeyOf(owner);
  const ownerDIDDocument = await getOrCreateDID(
    ownerPubKey,
    payer,
    createSignedTx,
    cluster
  );

  const inviteeDIDDocument = await getDocument(inviteeDID);

  // create and encrypt a CEK for the new channel
  const cek = await generateCEK();
  const ownerCEK = await encryptCEKForDID(cek, ownerDIDDocument.id);
  const inviteeCEK = await encryptCEKForDID(cek, inviteeDIDDocument.id);

  const connection = SolanaUtil.getConnection(cluster);

  // create the channel
  const channelAddress = await SolariumTransaction.createDirectChannel(
    pubkeyOf(payer),
    didToPublicKey(ownerDIDDocument.id),
    ownerPubKey,
    didToPublicKey(inviteeDID),
    ownerCEK.toChainData(),
    inviteeCEK.toChainData(),
    createSignedTx,
    cluster
  );

  return getChannel(
    owner,
    ownerDIDDocument.id,
    channelAddress,
    connection,
    cluster
  );
};
