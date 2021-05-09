import {PublicKey} from '@solana/web3.js';
import {CreateRequest, makeKeypair} from "../lib/util";
import {Inbox} from "../lib/Inbox";
import * as service from "../service/create";
import {SolanaUtil} from "../lib/solana/solanaUtil";

/**
 * Creates an inbox
 * @param request
 */
export const create = async (request: CreateRequest): Promise<Inbox> => {
  const payer = makeKeypair(request.payer);
  const owner = request.owner
    ? new PublicKey(request.owner)
    : payer.publicKey
  const connection = SolanaUtil.getConnection();
  
  return service.create(owner, payer, connection)
};
