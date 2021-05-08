import {Account, Connection, PublicKey} from '@solana/web3.js';
import {PrivateKey, PublicKeyBase58} from "../lib/util";
import {SolariumTransaction} from "../lib/solana/transaction";
import {Inbox} from "../lib/Inbox";

/**
 * Creates an inbox
 * @param inbox
 * @param connection
 * @param ownerKey
 */
export const get = async (inbox: PublicKey, connection: Connection, ownerKey?: PrivateKey): Promise<Inbox | null> => {
  const inboxData = await SolariumTransaction.getInboxData(connection, inbox);
  
  return inboxData && Inbox.fromChainData(inboxData, ownerKey)
};
