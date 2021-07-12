import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  didToPublicKey,
  ExtendedCluster,
  isKeypair,
  pubkeyOf,
} from '../lib/util';
import { defaultSignCallback, SignCallback } from '../lib/wallet';
import { SolariumTransaction } from '../lib/solana/transaction';
import { UserDetails } from '../lib/UserDetails';

export const getUserDetails = async (
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

  await SolariumTransaction.createUserDetails(
    pubkeyOf(payer),
    ownerDIDKey,
    pubkeyOf(owner),
    createSignedTx,
    alias,
    size,
    cluster
  );
};
