import {PublicKeyBase58, ReadRequest} from "../lib/util";
import * as service from "../service/get";
import {SolanaUtil} from "../lib/solana/solanaUtil";
import {DecentralizedIdentifier} from "@identity.com/sol-did-client";
import {getKeyFromOwner} from "../lib/solana/instruction";

type Message = {
  sender: PublicKeyBase58,
  content: string;
}

/**
 * Reads an inbox
 * @param request
 */
export const read = async (request: ReadRequest): Promise<Message[]> => {
  const connection = SolanaUtil.getConnection();
  const ownerAddress = DecentralizedIdentifier.parse(request.ownerDID).pubkey.toPublicKey();
  const inboxAddress = await getKeyFromOwner(ownerAddress);
  
  const inbox = await service.get(inboxAddress, connection, request.ownerKey)
  
  if (!inbox) throw new Error("No inbox found")
  
  return inbox.messages;
};
