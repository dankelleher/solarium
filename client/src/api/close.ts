import {CloseRequest, makeKeypair} from "../lib/util";
import * as service from "../service/close";
import {SolanaUtil} from "../lib/solana/solanaUtil";

/**
 * Deletes an inbox
 * @param request
 */
export const close = async (request: CloseRequest): Promise<void> => {
  const payer = makeKeypair(request.payer);
  const signer = request.signer
    ? makeKeypair(request.signer)
    : payer
  const connection = SolanaUtil.getConnection();
  
  await service.close(request.ownerDID, payer, signer, connection);
};
