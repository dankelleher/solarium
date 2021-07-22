import {
  pubkeyOf,
  toSolanaKeyMaterial,
  UpdateUserDetailsRequest,
} from '../../lib/util';
import { updateUserDetails } from '../../service/userDetails';
import { didFromKey } from './util';
import { SolanaUtil } from '../../lib/solana/solanaUtil';

/**
 * Update a userdetails account
 * @param request
 */
export const update = async (
  request: UpdateUserDetailsRequest
): Promise<void> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const owner = request.owner
    ? toSolanaKeyMaterial(request.owner)
    : pubkeyOf(payer);
  const ownerDID = await didFromKey(request);
  const connection = SolanaUtil.getConnection(request.cluster);

  await updateUserDetails(
    ownerDID,
    connection,
    owner,
    payer,
    request.alias,
    request.addressBook,
    request.signCallback,
    request.cluster
  );
};
