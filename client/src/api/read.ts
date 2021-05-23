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
  if (request.ownerDID) return Promise.resolve(request.ownerDID);
  if (request.owner)
    return keyToIdentifier(
      new PublicKey(request.owner),
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

  const ownerDID = await didFromKey(request);

  const inbox = await service.get(
    new PublicKey(request.channel),
    connection,
    ownerDID,
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

  const ownerDID$ = from(didFromKey(request));

  return ownerDID$.pipe(
    switchMap((ownerDID: string) => {
      const channel$ = service.getStream(
        new PublicKey(request.channel),
        connection,
        ownerDID,
        request.decryptionKey,
        request.cluster
      );
      const uniqueKey = (m: Message) => m.content + m.sender; // TODO add timestamp

      return channel$
        .pipe(switchMap((channel: Channel) => channel.messages))
        .pipe(distinct(uniqueKey)); // only emit a message once
    }));
};
