import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  debug,
  didToPublicKey,
  ExtendedCluster,
  getErrorMessage,
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
  encryptCEKForUserKey,
  generateCEK,
} from '../lib/crypto/SolariumCrypto';
import { Channel } from '../lib/Channel';
import { get } from './get';
import { getOrCreateUserDetails, getUserDetailsSafe } from './userDetails';
import { User } from '../lib/User';

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
    if (getErrorMessage(error).startsWith('No DID found')) {
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

const getOrCreateUser = async (
  owner: PublicKey,
  payer: Keypair | PublicKey,
  signCallback: SignCallback,
  alias?: string,
  userDetailsSize?: number,
  cluster?: ExtendedCluster
): Promise<User> => {
  const didDocument = await getOrCreateDID(owner, payer, signCallback, cluster);
  const userDetails = await getOrCreateUserDetails(
    didDocument.id,
    owner,
    payer,
    alias,
    userDetailsSize,
    signCallback,
    cluster
  );

  return new User(didDocument, userDetails);
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

  const ownerUser = await getOrCreateUser(
    pubkeyOf(owner),
    payer,
    createSignedTx,
    undefined,
    undefined,
    cluster
  );
  const didKey = didToPublicKey(ownerUser.didDocument.id);

  const connection = SolanaUtil.getConnection(cluster);
  const cek = await createEncryptedCEK(ownerUser.userDetails.userPubKey);

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
    ownerUser.didDocument.id,
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

  const ownerUser = await getOrCreateUser(
    ownerPubKey,
    payer,
    createSignedTx,
    undefined,
    undefined,
    cluster
  );

  const inviteeDIDDocument = await getDocument(inviteeDID);

  const connection = SolanaUtil.getConnection(cluster);

  // create and encrypt a CEK for the new channel
  const cek = generateCEK();
  const inviteeUserDetails = await getUserDetailsSafe(
    inviteeDIDDocument.id,
    false,
    connection
  );

  const ownerCEK = await encryptCEKForUserKey(
    cek,
    ownerUser.userDetails.userPubKey
  );
  const inviteeCEK = await encryptCEKForUserKey(
    cek,
    inviteeUserDetails.userPubKey
  );

  // create the channel
  const channelAddress = await SolariumTransaction.createDirectChannel(
    pubkeyOf(payer),
    didToPublicKey(ownerUser.didDocument.id),
    ownerPubKey,
    didToPublicKey(inviteeDID),
    ownerCEK.toChainData(),
    inviteeCEK.toChainData(),
    createSignedTx,
    cluster
  );

  return getChannel(
    owner,
    ownerUser.didDocument.id,
    channelAddress,
    connection,
    cluster
  );
};
