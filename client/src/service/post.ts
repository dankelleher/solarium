import {Connection, Keypair, PublicKey} from '@solana/web3.js';
import { arrayOf, didToPublicKey, ExtendedCluster } from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { MESSAGE_SIZE_BYTES } from '../lib/constants';
import { defaultSignCallback, SignCallback } from '../lib/wallet';
import {getDirectChannelAccountKey} from "../lib/solana/instruction";
import {get} from "./get";


const postToChannel = async (
  connection: Connection,
  channelAddress: PublicKey,
  message: string,
  senderDID: string,
  signer: Keypair,
  signCallback: SignCallback | undefined,
  payer: Keypair | undefined,
  cluster: ExtendedCluster | undefined) => {
  const channel = await get(channelAddress, connection, senderDID, signer.secretKey, cluster);
  const encryptedMessage = await channel.encrypt(message);

  if (encryptedMessage.length > MESSAGE_SIZE_BYTES) {
    throw new Error('Message too long');
  }

  const createSignedTx =
    signCallback || (payer && defaultSignCallback(payer, ...arrayOf(signer)));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const senderDIDKey = didToPublicKey(senderDID);

  await SolariumTransaction.postMessage(
    channelAddress,
    senderDIDKey,
    signer.publicKey,
    encryptedMessage,
    createSignedTx,
    cluster
  );
};

/**
 * Post a message to a group channel
 * @param connection
 * @param senderDID
 * @param channel
 * @param signer
 * @param payer
 * @param message
 * @param signCallback
 * @param cluster
 */
export const post = async (
  connection: Connection,
  senderDID: string,
  channel: PublicKey,
  message: string,
  signer: Keypair,
  payer?: Keypair,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  await postToChannel(connection, channel, message, senderDID, signer, signCallback, payer, cluster)
};


/**
 * Post a message to a direct channel
 * @param connection
 * @param senderDID
 * @param recipientDID
 * @param signer
 * @param payer
 * @param message
 * @param signCallback
 * @param cluster
 */
export const postDirect = async (
  connection: Connection,
  senderDID: string,
  recipientDID: string,
  message: string,
  signer: Keypair,
  payer?: Keypair,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const recipientDIDKey = didToPublicKey(recipientDID);
  const senderDIDKey = didToPublicKey(senderDID);
  const channelAddress = await getDirectChannelAccountKey(senderDIDKey, recipientDIDKey);

  await postToChannel(connection, channelAddress, message, senderDID, signer, signCallback, payer, cluster);
};
