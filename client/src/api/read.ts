import { currentCluster, makeKeypair, ReadRequest } from '../lib/util';
import * as service from '../service/get';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import { keyToIdentifier } from '@identity.com/sol-did-client';
import { distinct, switchMap } from 'rxjs/operators';
import { from, Observable, merge } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { Channel, Message } from '../lib/Channel';

const didFromKey = (request: ReadRequest): Promise<string> => {
  if (request.memberDID) return Promise.resolve(request.memberDID);
  if (request.member)
    return keyToIdentifier(
      new PublicKey(request.member),
      currentCluster(request.cluster)
    );
  return keyToIdentifier(
    makeKeypair(request.decryptionKey).publicKey,
    currentCluster(request.cluster)
  );
};

/**
 * Reads a channel
 * @param request
 */
export const read = async (request: ReadRequest): Promise<Message[]> => {
  const connection = SolanaUtil.getConnection(request.cluster);

  const memberDID = await didFromKey(request);

  const channel = await service.get(
    new PublicKey(request.channel),
    connection,
    memberDID,
    request.decryptionKey,
    request.cluster
  );

  if (!channel) throw new Error('No channel found');

  return channel.messages;
};

/**
 * Subscribe to channel updates
 * @param request
 */
export const readStream = (request: ReadRequest): Observable<Message> => {
  const connection = SolanaUtil.getConnection(request.cluster);

  const memberDID$ = from(didFromKey(request));

  return memberDID$.pipe(
    switchMap((memberDID: string) => {
      const channelInit$ = from(
        service.get(
          new PublicKey(request.channel),
          connection,
          memberDID,
          request.decryptionKey,
          request.cluster
        )
      );

      const channelStream$ = service.getStream(
        new PublicKey(request.channel),
        connection,
        memberDID,
        request.decryptionKey,
        request.cluster
      );
      const uniqueKey = (m: Message): string =>
        m.content + m.sender.did + m.timestamp;

      return merge(channelInit$, channelStream$)
        .pipe(switchMap((channel: Channel) => channel.messages))
        .pipe(distinct(uniqueKey)); // only emit a message once
    })
  );
};
