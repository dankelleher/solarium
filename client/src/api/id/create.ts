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
  const owner = request.owner ? toSolanaKeyMaterial(request.owner) : payer;

  try {
    return await getDID(pubkeyOf(owner), request.cluster);
  } catch (e) {
    return createDID(
      owner,
      payer,
      request.alias,
      request.additionalKeys,
      request.signCallback,
      request.cluster
    );
  }
};
