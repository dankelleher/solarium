import { PublicKey } from '@solana/web3.js';
import {
  CreateDIDRequest,
  pubkeyOf,
  toSolanaKeyMaterial,
} from '../../lib/util';
import { DIDDocument } from 'did-resolver';
import { create as createDID } from '../../lib/did/create';
import { get as getDID } from '../../lib/did/get';

/**
 * Create a DID document for a key or return an existing one
 * @param request
 */
export const create = async (
  request: CreateDIDRequest
): Promise<DIDDocument> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const owner = request.owner ? new PublicKey(request.owner) : undefined;
  const authority = owner || pubkeyOf(payer);

  try {
    return await getDID(authority, request.cluster);
  } catch (e) {
    return createDID(authority, payer, request.signCallback, request.cluster);
  }
};
