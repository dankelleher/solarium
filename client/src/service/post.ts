import { Keypair } from '@solana/web3.js';
import { arrayOf, didToPublicKey, ExtendedCluster } from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { getKeyFromOwner } from '../lib/solana/instruction';
import { SolariumCrypto } from '../lib/crypto/SolariumCrypto';
import { MESSAGE_SIZE_BYTES } from '../lib/constants';
import { compress } from '../lib/compression';
import { defaultSignCallback, SignCallback } from '../lib/wallet';

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
  const inbox = await getKeyFromOwner(ownerDIDKey);

  const senderDIDKey = didToPublicKey(senderDID);
  const crypto = new SolariumCrypto(senderDID, signer.secretKey);
  const encryptedMessage = await crypto.encrypt(message, ownerDID);
  const encodedBytes = compress(encryptedMessage);
  const encodedMessage = encodedBytes.toString('base64'); // TODO change program to accept byte arrays

  console.log(
    `Encoded message length ${encodedMessage.length} bytes ${encodedBytes.length}`
  );

  if (encodedMessage.length > MESSAGE_SIZE_BYTES) {
    throw Error(
      `Message too long - encoded size ${encodedMessage.length}, max length ${MESSAGE_SIZE_BYTES}, (raw bytes ${encodedBytes.length})`
    );
  }

  const createSignedTx =
    signCallback || (payer && defaultSignCallback(payer, ...arrayOf(signer)));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  await SolariumTransaction.post(
    senderDIDKey,
    signer.publicKey,
    inbox,
    encodedMessage,
    createSignedTx,
    cluster
  );
};
