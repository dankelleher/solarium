import {PublicKey} from '@solana/web3.js';
import {addKey as addKeyToDID} from "../lib/did/addKey";
import {AddKeyRequest, makeKeypair} from "../lib/util";
import {DIDDocument} from "did-resolver";

/**
 * Add an owner to an inbox
 * @param request
 */
export const addKey = async ( request :AddKeyRequest ): Promise<DIDDocument> => {
  const ownerKey = request.ownerKey || request.payer
  return addKeyToDID(
    request.ownerDID, request.keyIdentifier, new PublicKey(request.newKey), makeKeypair(ownerKey), makeKeypair(request.payer)
  );
};
