import {currentCluster, makeKeypair, PostRequest} from "../lib/util";
import * as service from "../service/post";
import {SolanaUtil} from "../lib/solana/solanaUtil";
import {keyToIdentifier} from "@identity.com/sol-did-client";

/**
 * Post a message to an inbox
 * @param request
 */
export const post = async (request: PostRequest): Promise<void> => {
  const payer = makeKeypair(request.payer);
  const signer = request.signer
    ? makeKeypair(request.signer)
    : payer
  const connection = SolanaUtil.getConnection();
  const senderDID = request.senderDID || await keyToIdentifier(makeKeypair(request.payer).publicKey, currentCluster());
  return service.post(request.ownerDID, senderDID, signer, payer, request.message, connection)
};
