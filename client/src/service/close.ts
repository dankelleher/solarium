import { Keypair, PublicKey } from '@solana/web3.js';
import {
  arrayOf,
  didToPublicKey,
  ExtendedCluster,
  isKeypair,
  pubkeyOf,
} from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { getKeyFromOwner } from '../lib/solana/instruction';
import { defaultSignCallback, SignCallback } from '../lib/wallet';

/**
 * Deletes an inbox
 * @param ownerDID
 * @param payer
 * @param signer
 * @param receiver
 * @param signCallback
 */
export const close = async (
  ownerDID: string,
  payer: Keypair | PublicKey,
  signer?: Keypair,
  receiver?: PublicKey,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const ownerDIDKey = didToPublicKey(ownerDID);
  const inbox = await getKeyFromOwner(ownerDIDKey);
  const ownerPubkey = signer ? signer.publicKey : pubkeyOf(payer);
  const receiverPubkey = receiver || pubkeyOf(payer);
  const createSignedTx =
    signCallback ||
    (isKeypair(payer) && defaultSignCallback(payer, ...arrayOf(signer)));

  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  await SolariumTransaction.closeInbox(
    inbox,
    ownerDIDKey,
    ownerPubkey,
    receiverPubkey,
    createSignedTx,
    cluster
  );
};
