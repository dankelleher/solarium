import {
  CreateUserDetailsRequest,
  currentCluster,
  pubkeyOf,
  toSolanaKeyMaterial,
  UpdateUserDetailsRequest,
} from '../../lib/util';
import { keyToIdentifier } from '@identity.com/sol-did-client';

// TODO merge these with other didFromKey functions once the "Request" types are refactored to
// use common names
export const didFromKey = (
  request: CreateUserDetailsRequest | UpdateUserDetailsRequest
): Promise<string> => {
  if (request.ownerDID) return Promise.resolve(request.ownerDID);
  if (request.owner)
    return keyToIdentifier(
      pubkeyOf(toSolanaKeyMaterial(request.owner)),
      currentCluster(request.cluster)
    );
  if (request.payer)
    return keyToIdentifier(
      pubkeyOf(toSolanaKeyMaterial(request.payer)),
      currentCluster(request.cluster)
    );

  throw new Error(
    'Unable to obtain DID from request - set either the ownerDID, owner or payer'
  );
};
