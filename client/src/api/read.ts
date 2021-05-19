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
import { getKeyFromOwner } from '../lib/solana/instruction';
import { distinct, switchMap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { Inbox } from '../lib/Inbox';

type Message = {
  sender: PublicKeyBase58;
  content: string;
};

const didFromKey = (request: ReadRequest): Promise<string> => {
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

const getInboxAddress = async (request: ReadRequest): Promise<PublicKey> => {
  const did = request.ownerDID || (await didFromKey(request));
  const ownerAddress = DecentralizedIdentifier.parse(did).pubkey.toPublicKey();
  return getKeyFromOwner(ownerAddress);
};

/**
 * Reads an inbox
 * @param request
 */
export const read = async (request: ReadRequest): Promise<Message[]> => {
  const connection = SolanaUtil.getConnection(request.cluster);

  const inboxAddress = await getInboxAddress(request);

  const inbox = await service.get(
    inboxAddress,
    connection,
    request.decryptionKey,
    request.cluster
  );

  if (!inbox) throw new Error('No inbox found');

  return inbox.messages;
};

/**
 * Subscribe to inbox updates
 * @param request
 */
export const readStream = (request: ReadRequest): Observable<Message> => {
  const connection = SolanaUtil.getConnection(request.cluster);

  const inboxAddress$ = from(getInboxAddress(request));

  return inboxAddress$.pipe(
    switchMap((inboxAddress: PublicKey) => {
      const inbox$ = service.getStream(
        inboxAddress,
        connection,
        request.decryptionKey,
        request.cluster
      );
      const uniqueKey = (m: Message) => m.content + m.sender; // TODO add timestamp

      return inbox$
        .pipe(switchMap((inbox: Inbox) => inbox.messages))
        .pipe(distinct(uniqueKey)); // only emit a message once
    })
  );
};
