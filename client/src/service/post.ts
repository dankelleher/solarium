import { Keypair } from '@solana/web3.js';
import { arrayOf, didToPublicKey, ExtendedCluster } from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { SolariumCrypto } from '../lib/crypto/SolariumCrypto';
import { MESSAGE_SIZE_BYTES } from '../lib/constants';
import { compress } from '../lib/compression';
import { defaultSignCallback, SignCallback } from '../lib/wallet';
import {getDirectChannelAccountKey} from "../lib/solana/instruction";

/**
 * Post a message to an inbox
 * @param ownerDID
 * @param senderDID
 * @param signer
 * @param payer
 * @param message
 * @param signCallback
 * @param cluster
 */
export const post = async (
  ownerDID: string,
  senderDID: string,
  message: string,
  signer: Keypair,
  payer?: Keypair,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const ownerDIDKey = didToPublicKey(ownerDID);
  const senderDIDKey = didToPublicKey(senderDID);
  const channel = await getDirectChannelAccountKey(senderDIDKey, ownerDIDKey);
  
  // TODO encrypt message

  const createSignedTx =
    signCallback || (payer && defaultSignCallback(payer, ...arrayOf(signer)));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  await SolariumTransaction.postMessage(
    channel,
    senderDIDKey,
    signer.publicKey,
    message,
    createSignedTx,
    cluster
  );
};
