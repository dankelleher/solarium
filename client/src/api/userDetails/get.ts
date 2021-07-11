import {GetUserDetailsRequest} from '../../lib/util';
import {getUserDetails} from "../../service/userDetails";
import {UserDetails} from "../../lib/UserDetails";
import {SolanaUtil} from "../../lib/solana/solanaUtil";

/**
 * Get a DID's solarium user details
 * @param request
 */
export const get = async (request: GetUserDetailsRequest): Promise<UserDetails | null> => {
  const connection = SolanaUtil.getConnection(request.cluster);
  return getUserDetails(request.did, connection);
};
