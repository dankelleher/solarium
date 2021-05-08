import {makeAccount, PostRequest} from "../lib/util";
import * as service from "../service/post";
import {SolanaUtil} from "../lib/solana/solanaUtil";

/**
 * Post a message to an inbox
 * @param request
 */
export const post = async (request: PostRequest): Promise<void> => {
  const payer = makeAccount(request.payer);
  const signer = request.signer
    ? makeAccount(request.signer)
    : payer
  const connection = SolanaUtil.getConnection();
  return service.post(request.ownerDID, request.senderDID, signer, payer, request.message, connection)
};
