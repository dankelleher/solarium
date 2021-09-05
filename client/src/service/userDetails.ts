import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  didToPublicKey,
  ExtendedCluster,
  isKeypair,
  pubkeyOf,
} from '../lib/util';
import { defaultSignCallback, SignCallback } from '../lib/wallet';
import { SolariumTransaction } from '../lib/solana/transaction';
import { AddressBook, UserDetails } from '../lib/UserDetails';
import { SolariumCache } from '../lib/cache';
import { makeUserKeyPair } from '../lib/crypto/UserAccountCrypto';
import { getDocument } from '../lib/did/get';
import { augmentDIDDocument } from '../lib/crypto/ChannelCrypto';

const getUserDetailsDirect = async (
  did: string,
  connection: Connection
): Promise<UserDetails | null> => {
  const didKey = didToPublicKey(did);
  const encryptedUserDetails = await SolariumTransaction.getUserDetails(
    connection,
    didKey
  );

  if (!encryptedUserDetails) return null;

  return UserDetails.fromChainData(encryptedUserDetails);
};
export const userDetailsCache = new SolariumCache<
  UserDetails | null,
  (key: string, connection: Connection) => Promise<UserDetails | null>
>(getUserDetailsDirect);

export const getUserDetails = userDetailsCache.load.bind(userDetailsCache);

/**
 * Create a Solarium user details account for a DID
 * @param did
 * @param owner
 * @param payer
 * @param alias
 * @param size
 * @param signCallback
 * @param cluster
 */
export const createUserDetails = async (
  did: string,
  owner: Keypair | PublicKey,
  payer: Keypair | PublicKey,
  alias: string,
  size?: number,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const createSignedTx =
    signCallback ||
    (isKeypair(payer) && isKeypair(owner) && defaultSignCallback(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const ownerDIDKey = didToPublicKey(did);
  const ownerDIDDocument = await getDocument(did);

  const userKeyPair = await makeUserKeyPair(
    augmentDIDDocument(ownerDIDDocument)
  );

  const encryptedUserPrivateKeyData = userKeyPair.encryptedPrivateKeys.map(
    key => key.toChainData()
  );

  await SolariumTransaction.createUserDetails(
    pubkeyOf(payer),
    ownerDIDKey,
    pubkeyOf(owner),
    encryptedUserPrivateKeyData,
    Array.from(userKeyPair.userPubKey),
    createSignedTx,
    alias,
    size,
    cluster
  );
};

/**
 * Update a Solarium user details account
 * @param did
 * @param connection
 * @param owner
 * @param payer
 * @param alias
 * @param addressBook
 * @param signCallback
 * @param cluster
 */
export const updateUserDetails = async (
  did: string,
  connection: Connection,
  owner: Keypair | PublicKey,
  payer: Keypair | PublicKey,
  alias?: string,
  addressBook?: AddressBook,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const createSignedTx =
    signCallback ||
    (isKeypair(payer) && isKeypair(owner) && defaultSignCallback(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const ownerDIDKey = didToPublicKey(did);

  const existingUserDetails = await getUserDetailsDirect(did, connection);

  if (!existingUserDetails)
    throw new Error(`DID ${did} has no userDetails account`);

  await SolariumTransaction.updateUserDetails(
    ownerDIDKey,
    pubkeyOf(owner),
    createSignedTx,
    alias || existingUserDetails.alias,
    (addressBook || existingUserDetails.addressBook).toChainData(),
    cluster
  );
};
