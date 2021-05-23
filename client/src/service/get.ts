import { Connection, PublicKey } from '@solana/web3.js';
import {didToPublicKey, ExtendedCluster, PrivateKey} from '../lib/util';
import { SolariumTransaction } from '../lib/solana/transaction';
import { Channel } from '../lib/Channel';
import {from, Observable} from 'rxjs';
import {get as getDID} from "../lib/did/get";
import {ChannelData} from "../lib/solana/models/ChannelData";
import {switchMap} from "rxjs/operators";
import {CEKAccountData} from "../lib/solana/models/CEKAccountData";

/**
 * Gets an channel
 * @param channel
 * @param connection
 * @param ownerDID
 * @param ownerKey
 * @param cluster
 */
export const get = async (
  channel: PublicKey,
  connection: Connection,
  ownerDID: string,
  ownerKey?: PrivateKey,
  cluster?: ExtendedCluster
): Promise<Channel | null> => {
  const didKey = didToPublicKey(ownerDID);
  const channelData = await SolariumTransaction.getChannelData(connection, channel);
  const cekAccountData = await SolariumTransaction.getCEKAccountData(connection, didKey, channel);

  if (!cekAccountData) throw new Error(`No CEK account found for DID ${ownerDID}. Are they a member of the channel?`)

  return channelData && Channel.fromChainData(channelData, cekAccountData, ownerKey, cluster);
};

/**
 * Subscribe to channel updates
 * @param channel
 * @param connection
 * @param ownerDID
 * @param ownerKey
 * @param cluster
 */
export const getStream = (
  channel: PublicKey,
  connection: Connection,
  ownerDID: string,
  ownerKey?: PrivateKey,
  cluster?: ExtendedCluster
): Observable<Channel> => {
  const didKey = didToPublicKey(ownerDID);
  const cekAccountData$ = from(SolariumTransaction.getCEKAccountData(connection, didKey, channel));

  return cekAccountData$.pipe(switchMap((cekAccountData: CEKAccountData | null) => {
    if (!cekAccountData) throw new Error(`No CEK account found for DID ${ownerDID}. Are they a member of the channel?`);

    return new Observable<Channel>(subscriber => {
      connection.onAccountChange(channel, async accountInfo => {
        const channelData = await ChannelData.fromAccount(accountInfo.data);
        const channel = await Channel.fromChainData(channelData, cekAccountData, ownerKey, cluster);
        subscriber.next(channel);
      });
    });
  }));
};
