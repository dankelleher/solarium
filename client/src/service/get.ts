import {Connection, PublicKey} from '@solana/web3.js';
import {PrivateKey} from "../lib/util";
import {SolariumTransaction} from "../lib/solana/transaction";
import {Inbox} from "../lib/Inbox";
import {Observable} from "rxjs";
import {InboxData} from "../lib/solana/InboxData";

/**
 * Gets an inbox
 * @param inbox
 * @param connection
 * @param ownerKey
 */
export const get = async (inbox: PublicKey, connection: Connection, ownerKey?: PrivateKey): Promise<Inbox | null> => {
  const inboxData = await SolariumTransaction.getInboxData(connection, inbox);
  
  return inboxData && Inbox.fromChainData(inboxData, ownerKey)
};

/**
 * Subscribe to inbox updates
 * @param inbox
 * @param connection
 * @param ownerKey
 */
export const getStream = (inbox: PublicKey, connection: Connection, ownerKey?: PrivateKey): Observable<Inbox> =>
  new Observable<Inbox>((subscriber) => {
    connection.onAccountChange(inbox, async (accountInfo) => {
      const inboxData = await InboxData.fromAccount(accountInfo.data);
      const inbox = await Inbox.fromChainData(inboxData, ownerKey);
      subscriber.next(inbox)
    })
  });
