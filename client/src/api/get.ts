import { currentCluster, GetRequest, makeKeypair } from '../lib/util';
import * as service from '../service/get';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import {
  keyToIdentifier,
} from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { Channel } from '../lib/Channel';

const didFromKey = (request: GetRequest): Promise<string> => {
  if (request.ownerDID) return Promise.resolve(request.ownerDID);
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


/**
 * Reads an inbox
 * @param request
 */
export const get = async (request: GetRequest): Promise<Channel | null> => {
  const connection = SolanaUtil.getConnection(request.cluster);
  const ownerDID = await didFromKey(request);
  
  return service.get(
    new PublicKey(request.channel),
    connection,
    ownerDID,
    request.decryptionKey,
    request.cluster
  );
};
