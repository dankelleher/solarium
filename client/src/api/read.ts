import {
  currentCluster,
  makeKeypair,
  PublicKeyBase58,
  ReadRequest,
} from '../lib/util';
import * as service from '../service/get';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import {
  DecentralizedIdentifier,
  keyToIdentifier,
} from '@identity.com/sol-did-client';
import { distinct, switchMap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { Channel } from '../lib/Channel';

type Message = {
  sender: PublicKeyBase58;
  content: string;
};

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
 * Reads an channel
 * @param request
 */
export const read = async (request: ReadRequest): Promise<Message[]> => {
  const connection = SolanaUtil.getConnection(request.cluster);

  const memberDID = await didFromKey(request);

  const inbox = await service.get(
    new PublicKey(request.channel),
    connection,
    memberDID,
    request.decryptionKey,
    request.cluster
  );

  if (!inbox) throw new Error('No inbox found');

  return inbox.messages;
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
      const channel$ = service.getStream(
        new PublicKey(request.channel),
        connection,
        memberDID,
        request.decryptionKey,
        request.cluster
      );
      const uniqueKey = (m: Message) => m.content + m.sender; // TODO add timestamp

      return channel$
        .pipe(switchMap((channel: Channel) => channel.messages))
        .pipe(distinct(uniqueKey)); // only emit a message once
    }));
};
