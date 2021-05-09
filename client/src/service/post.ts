import {Keypair, Connection} from '@solana/web3.js';
import {didToPublicKey} from "../lib/util";
import {SolariumTransaction} from "../lib/solana/transaction";
import {getKeyFromOwner} from "../lib/solana/instruction";
import {SolariumCrypto} from "../lib/crypto/SolariumCrypto";
import {MESSAGE_SIZE_BYTES} from "../lib/constants";
import {encode} from "../lib/compression";

/**
 * Post a message to an inbox
 * @param ownerDID
 * @param senderDID
 * @param signer
 * @param payer
 * @param message
 * @param connection
 */
export const post = async (ownerDID: string, senderDID: string, signer: Keypair, payer: Keypair, message: string, connection: Connection): Promise<void> => {
  const ownerDIDKey = didToPublicKey(ownerDID);
  const inbox = await getKeyFromOwner(ownerDIDKey);

  const senderDIDKey = didToPublicKey(senderDID);
  const crypto = new SolariumCrypto(senderDID, signer.secretKey)
  const encryptedMessage = await crypto.encrypt(message, ownerDID)
  const encodedBytes = encode(encryptedMessage);
  const encodedMessage = encodedBytes.toString('base64')  // TODO change program to accept byte arrays
  
  console.log(`Encoded message length ${encodedMessage.length} bytes ${encodedBytes.length}`);
  
  if (encodedMessage.length > MESSAGE_SIZE_BYTES) {
    throw Error(
      `Message too long - encoded size ${encodedMessage.length}, max length ${MESSAGE_SIZE_BYTES}, (raw bytes ${encodedBytes.length})`
    )
  }
  await SolariumTransaction.post(connection, payer, senderDIDKey, signer, inbox, encodedMessage);
};
