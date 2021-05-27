import { PublicKey } from '@solana/web3.js';
import {GetDIDRequest} from '../../lib/util';
import { get as getDID } from '../../lib/did/get';
import { DIDDocument } from 'did-resolver';

/**
 * Get a DID document for a key
 * @param request
 */
export const get = async (request: GetDIDRequest): Promise<DIDDocument> => 
  getDID(new PublicKey(request.owner), request.cluster);
