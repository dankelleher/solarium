import {
  CreateUserDetailsRequest,
  currentCluster,
  pubkeyOf,
  toSolanaKeyMaterial,
} from '../../lib/util';
import { createUserDetails } from '../../service/userDetails';
import { keyToIdentifier } from '@identity.com/sol-did-client';

const didFromKey = (request: CreateUserDetailsRequest): Promise<string> => {
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

/**
 * Create a userdetails account for a DID
 * @param request
 */
export const create = async (
  request: CreateUserDetailsRequest
): Promise<void> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const owner = request.owner
    ? toSolanaKeyMaterial(request.owner)
    : pubkeyOf(payer);
  const ownerDID = await didFromKey(request);

  await createUserDetails(
    ownerDID,
    owner,
    payer,
    request.alias,
    request.size,
    request.signCallback,
    request.cluster
  );
};
