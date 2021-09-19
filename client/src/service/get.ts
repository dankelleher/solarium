import { Connection, PublicKey } from '@solana/web3.js';
import { didToPublicKey, ExtendedCluster, PrivateKey } from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { Channel } from '../lib/Channel';
import { from, Observable } from 'rxjs';
import { ChannelData } from '../lib/solana/models/ChannelData';
import { switchMap } from 'rxjs/operators';
import { CEKAccountDataV2 } from '../lib/solana/models/CEKAccountDataV2';
import { decryptUserKeyFromDID, UserPubKey } from '../lib/UserDetails';
import { getDocument } from '../lib/did/get';
import { getUserDetails } from './userDetails';

async function getUserPrivateKey(memberDID: string, connection: Connection, memberKey: number[] | string | Buffer | Uint8Array | undefined) {
  const userDetails = await getUserDetails(memberDID, false, connection);
  if (!userDetails) throw new Error(`No UserDetails found for ${memberDID}`);

  const memberDIDDocument = await getDocument(memberDID);
  const userPrivateKey = memberKey ? await decryptUserKeyFromDID(memberDIDDocument, memberKey, userDetails) : undefined;
  return userPrivateKey;
}

/**
 * Gets a channel
 * @param channel
 * @param connection
 * @param memberDID
 * @param memberKey
 * @param cluster
 */
export const get = async (
  channel: PublicKey,
  connection: Connection,
  memberDID: string,
  memberKey?: PrivateKey, // TODO: @Daniel why was this optional?
  cluster?: ExtendedCluster
): Promise<Channel> => {
  const didKey = didToPublicKey(memberDID);
  const channelData = await SolariumTransaction.getChannelData(
    connection,
    channel
  );

  if (!channelData) throw new Error(`Channel not found`);
  const userPrivateKey = await getUserPrivateKey(memberDID, connection, memberKey);

  const cekAccountData = await SolariumTransaction.getCEKAccountData(
    connection,
    didKey,
    channel
  );

  if (!cekAccountData)
    throw new Error(
      `No CEK account found for DID ${memberDID}. Are they a member of the channel?`
    );

  return Channel.fromChainData(
    channel,
    channelData,
    cekAccountData,
    userPrivateKey,
    cluster
  );
};

/**
 * Subscribe to channel updates
 * @param channel
 * @param connection
 * @param memberDID
 * @param memberKey
 * @param cluster
 */
export const getStream = (
  channel: PublicKey,
  connection: Connection,
  memberDID: string,
  memberKey?: PrivateKey,
  cluster?: ExtendedCluster
): Observable<Channel> => {
  const didKey = didToPublicKey(memberDID);
  const cekAccountData$ = from(
    SolariumTransaction.getCEKAccountData(connection, didKey, channel)
  );

  return cekAccountData$.pipe(
    switchMap((cekAccountData: CEKAccountDataV2 | null) => {
      if (!cekAccountData)
        throw new Error(
          `No CEK account found for DID ${memberDID}. Are they a member of the channel?`
        );

      return new Observable<Channel>(subscriber => {
        const id = connection.onAccountChange(channel, async accountInfo => {
          const channelData = await ChannelData.fromAccount(accountInfo.data);
          const userPrivateKey = await getUserPrivateKey(memberDID, connection, memberKey);
          const channelObject = await Channel.fromChainData(
            channel,
            channelData,
            cekAccountData,
            userPrivateKey,
            cluster
          );
          subscriber.next(channelObject);
        });

        // unsubscribe callback
        return (): void => {
          connection.removeAccountChangeListener(id);
        };
      });
    })
  );
};
