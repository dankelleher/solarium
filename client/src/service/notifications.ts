import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  didToPublicKey,
  ExtendedCluster,
  isKeypair,
  pubkeyOf,
} from '../lib/util';
import { defaultSignCallback, SignCallback } from '../lib/wallet';
import { SolariumTransaction } from '../lib/solana/transaction';
import { Notifications } from '../lib/Notifications';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { getNotificationsKey } from '../lib/solana/instruction';
import { NotificationsData } from '../lib/solana/models/NotificationsData';

/**
 * Retrieve the notifications for the DID
 * @param did
 * @param connection
 */
export const getNotifications = async (
  did: string,
  connection: Connection
): Promise<Notifications | null> => {
  const didKey = didToPublicKey(did);
  const notifications = await SolariumTransaction.getNotifications(
    connection,
    didKey
  );

  if (!notifications) return null;

  return Notifications.fromChainData(notifications);
};

/**
 * Subscribe to notifications
 * @param connection
 * @param did
 * @param cluster
 */
export const getStream = (
  connection: Connection,
  did: string,
  cluster?: ExtendedCluster
): Observable<Notifications> => {
  const didKey = didToPublicKey(did);
  const notificationsKey$ = from(getNotificationsKey(didKey));

  return notificationsKey$.pipe(
    switchMap((notificationsKey: PublicKey) => {
      return new Observable<Notifications>(subscriber => {
        const id = connection.onAccountChange(
          notificationsKey,
          async accountInfo => {
            const notificationsData = await NotificationsData.fromAccount(
              accountInfo.data
            );
            const notifications = await Notifications.fromChainData(
              notificationsData,
              cluster
            );
            subscriber.next(notifications);
          }
        );

        // unsubscribe callback
        return (): void => {
          connection.removeAccountChangeListener(id);
        };
      });
    })
  );
};

/**
 * Create a Solarium notifications account for a DID
 * @param did
 * @param owner
 * @param payer
 * @param size
 * @param signCallback
 * @param cluster
 */
export const createNotifications = async (
  did: string,
  owner: Keypair | PublicKey,
  payer: Keypair | PublicKey,
  size?: number,
  signCallback?: SignCallback,
  cluster?: ExtendedCluster
): Promise<void> => {
  const createSignedTx =
    signCallback ||
    (isKeypair(payer) && isKeypair(owner) && defaultSignCallback(payer, owner));
  if (!createSignedTx) throw new Error('No payer or sign callback specified');

  const ownerDIDKey = didToPublicKey(did);

  await SolariumTransaction.createNotificationsAccount(
    pubkeyOf(payer),
    ownerDIDKey,
    pubkeyOf(owner),
    createSignedTx,
    size,
    cluster
  );
};
