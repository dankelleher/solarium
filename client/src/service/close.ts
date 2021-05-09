import {Connection, Keypair} from '@solana/web3.js';
import {didToPublicKey} from "../lib/util";
import {SolariumTransaction} from "../lib/solana/transaction";
import {getKeyFromOwner} from "../lib/solana/instruction";

/**
 * Deletes an inbox
 * @param ownerDID
 * @param payer
 * @param signer
 * @param connection
 */
export const close = async (ownerDID: string, payer: Keypair, signer: Keypair, connection: Connection): Promise<void> => {
  const ownerDIDKey = didToPublicKey(ownerDID);
  const inbox = await getKeyFromOwner(ownerDIDKey);
  
  await SolariumTransaction.closeInbox(connection, inbox, payer, ownerDIDKey, signer);
};
