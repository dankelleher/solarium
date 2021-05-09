import {makeKeypair, PublicKeyBase58, ReadRequest} from "../lib/util";
import * as service from "../service/get";
import {SolanaUtil} from "../lib/solana/solanaUtil";
import {DecentralizedIdentifier, keyToIdentifier} from "@identity.com/sol-did-client";
import {getKeyFromOwner} from "../lib/solana/instruction";
import {DEFAULT_CLUSTER} from "../lib/constants";
import {distinct, switchMap} from "rxjs/operators";
import {from, Observable} from "rxjs";
import {PublicKey} from "@solana/web3.js";
import {Inbox} from "../lib/Inbox";

type Message = {
  sender: PublicKeyBase58,
  content: string;
}

async function getInboxAddress(request: ReadRequest):Promise<PublicKey> {
  const did = request.ownerDID || await keyToIdentifier(makeKeypair(request.ownerKey).publicKey, DEFAULT_CLUSTER);
  const ownerAddress = DecentralizedIdentifier.parse(did).pubkey.toPublicKey();
  return getKeyFromOwner(ownerAddress);
}

/**
 * Reads an inbox
 * @param request
 */
export const read = async (request: ReadRequest): Promise<Message[]> => {
  const connection = SolanaUtil.getConnection();

  const inboxAddress = await getInboxAddress(request);

  const inbox = await service.get(inboxAddress, connection, request.ownerKey)

  if (!inbox) throw new Error("No inbox found")

  return inbox.messages;
};

/**
 * Subscribe to inbox updates
 * @param request
 */
export const readStream = (request: ReadRequest): Observable<Message> => {
  const connection = SolanaUtil.getConnection();

  const inboxAddress$ = from(getInboxAddress(request));

  return inboxAddress$.pipe(switchMap((inboxAddress:PublicKey) => {
    const inbox$ = service.getStream(inboxAddress, connection, request.ownerKey)
    const uniqueKey = (m:Message) => m.content + m.sender; // TODO add timestamp
    
    return inbox$
      .pipe(switchMap((inbox:Inbox) => inbox.messages))
      .pipe(distinct(uniqueKey)); // only emit a message once 
  }));
};