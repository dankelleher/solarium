import {
  CreateUserDetailsRequest,
  pubkeyOf,
  toSolanaKeyMaterial,
} from '../../lib/util';
import { createUserDetails } from '../../service/userDetails';
import { didFromKey } from './util';

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
