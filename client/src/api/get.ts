import { currentCluster, GetRequest, makeKeypair } from '../lib/util';
import * as service from '../service/get';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import {
  DecentralizedIdentifier,
  keyToIdentifier,
} from '@identity.com/sol-did-client';
import { getKeyFromOwner } from '../lib/solana/instruction';
import { PublicKey } from '@solana/web3.js';
import { Inbox } from '../lib/Inbox';

const didFromKey = (request: GetRequest): Promise<string> => {
  if (request.owner)
    return keyToIdentifier(
      new PublicKey(request.owner),
      currentCluster(request.cluster)
    );
  if (request.decryptionKey)
    return keyToIdentifier(
      makeKeypair(request.decryptionKey).publicKey,
      currentCluster(request.cluster)
    );
  throw new Error(
    'Unable to obtain DID from request - set either the owner or decryption key'
  );
};

const getInboxAddress = async (request: GetRequest): Promise<PublicKey> => {
  const did = request.ownerDID || (await didFromKey(request));
  const ownerAddress = DecentralizedIdentifier.parse(did).pubkey.toPublicKey();
  return getKeyFromOwner(ownerAddress);
};

/**
 * Reads an inbox
 * @param request
 */
export const get = async (request: GetRequest): Promise<Inbox | null> => {
  const connection = SolanaUtil.getConnection(request.cluster);

  const inboxAddress = await getInboxAddress(request);

  return service.get(
    inboxAddress,
    connection,
    request.decryptionKey,
    request.cluster
  );
};
