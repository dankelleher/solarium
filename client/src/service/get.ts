import {AccountChangeCallback, Connection, PublicKey} from '@solana/web3.js';
import {didToPublicKey, ExtendedCluster, PrivateKey} from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { Channel } from '../lib/Channel';
import {from, Observable, bindCallback} from 'rxjs';
import {ChannelData} from "../lib/solana/models/ChannelData";
import {switchMap} from "rxjs/operators";
import {CEKAccountData} from "../lib/solana/models/CEKAccountData";

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
  memberKey?: PrivateKey,
  cluster?: ExtendedCluster
): Promise<Channel> => {
  const didKey = didToPublicKey(memberDID);
  const channelData = await SolariumTransaction.getChannelData(connection, channel);

  if (!channelData) throw new Error(`Channel not found`)

  const cekAccountData = await SolariumTransaction.getCEKAccountData(connection, didKey, channel);

  if (!cekAccountData) throw new Error(`No CEK account found for DID ${memberDID}. Are they a member of the channel?`)

  return Channel.fromChainData(channel, channelData, cekAccountData, memberDID, memberKey, cluster);
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
  const cekAccountData$ = from(SolariumTransaction.getCEKAccountData(connection, didKey, channel));

  return cekAccountData$.pipe(switchMap((cekAccountData: CEKAccountData | null) => {
    if (!cekAccountData) throw new Error(`No CEK account found for DID ${memberDID}. Are they a member of the channel?`);

    // Work in Progress
    const initialChannelData$ = from(SolariumTransaction.getChannelData(connection, channel))
    const onAccountChange$ = bindCallback(
        (channel: PublicKey, callback: AccountChangeCallback) => connection.onAccountChange(channel, callback))

    return new Observable<Channel>(subscriber => {
      connection.onAccountChange(channel, async accountInfo => {
        const channelData = await ChannelData.fromAccount(accountInfo.data);
        const channelObject = await Channel.fromChainData(channel, channelData, cekAccountData, memberDID, memberKey, cluster);
        subscriber.next(channelObject);
      });
    });
  }));
};
