import {Connection, PublicKey, Account} from '@solana/web3.js';
import {didToPublicKey} from "../lib/util";
import {SolariumTransaction} from "../lib/solana/transaction";
import {get as getDID} from "../lib/did/get";
import {create as createDID} from "../lib/did/create";
import {DIDDocument} from "did-resolver";
import {Inbox} from "../lib/Inbox";
import {get} from "./get";

/**
 * If a DID was already registered for this owner, return its document. Else create one
 * @param owner
 * @param payer
 */
const getOrCreateDID = async (owner: PublicKey, payer: Account): Promise<DIDDocument> => {
  try {
    console.log(`Looking for a DID owned by ${owner.toBase58()}`);
    return await getDID(owner);
  } catch (error) {
    if (error.message.startsWith('No DID found')) {
      console.log("No DID found - creating...");
      return createDID(owner, payer)
    }
    throw error;
  }
} 

/**
 * Creates an inbox
 * @param owner
 * @param payer
 * @param connection
 */
export const create = async (owner: PublicKey, payer: Account, connection: Connection): Promise<Inbox> => {
  const didForOwner = await getOrCreateDID(owner, payer)
  const didKey = didToPublicKey(didForOwner.id)

  console.log(`Creating inbox for DID: ${didForOwner.id}`);

  const inboxAddress = await SolariumTransaction.createInbox(connection, payer, didKey);
  const inbox = await get(inboxAddress, connection);
  
  if (!inbox) {
    throw new Error('Error retrieving created inbox');
  }
  
  return inbox;
};
