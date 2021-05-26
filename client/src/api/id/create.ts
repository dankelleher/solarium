import { PublicKey } from '@solana/web3.js';
import { GetDIDRequest } from '../../lib/util';
import { DIDDocument } from 'did-resolver';
import {keyToIdentifier, resolve} from '@identity.com/sol-did-client';

/**
 * Get a DID document for a key
 * @param request
 */
export const get = async (request: GetDIDRequest): Promise<DIDDocument> => {
  const did = await keyToIdentifier(new PublicKey(request.owner));
  return resolve(did);
};
