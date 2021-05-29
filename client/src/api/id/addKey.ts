import { Keypair, PublicKey } from '@solana/web3.js';
import { addKey as addKeyToDID } from "../../lib/did/addKey";
import {
  AddKeyRequest,
  currentCluster, debug,
  isKeypair,
  makeKeypair,
  pubkeyOf, PublicKeyBase58,
  toSolanaKeyMaterial,
} from '../../lib/util';
import { DIDDocument } from 'did-resolver';
import { keyToIdentifier } from '@identity.com/sol-did-client';
import {updateCEKAccount} from "../../service/updateCEKAccount";

const didFromKey = (request: AddKeyRequest): Promise<string> => {
  if (request.signer)
    return keyToIdentifier(
      new PublicKey(request.signer),
      currentCluster(request.cluster)
    );
  return keyToIdentifier(
    pubkeyOf(toSolanaKeyMaterial(request.payer)),
    currentCluster(request.cluster)
  );
};

function isEmpty(array: any[]) {
  return !array || array.length === 0;
}

/**
 * Add an owner to an DID, and all known channels the DID is in
 * @param request
 */
export const addKey = async (request: AddKeyRequest): Promise<DIDDocument> => {
  const did = request.ownerDID || (await didFromKey(request));
  const payer = toSolanaKeyMaterial(request.payer);
  const signer = toSolanaKeyMaterial(request.signer);
  
  // The API requires a payer either as a keypair or a pubkey but
  // In this case, the payer must either be a keypair or not present at all,
  // since the payer is only needed when request.signCallback is missing
  // this is a messy API which needs to be cleaned up TODO
  const payerOrUndefined = isKeypair(payer) ? payer : undefined;
  
  if (!isEmpty(request.channelsToUpdate) && !isKeypair(signer)) {
    throw new Error("A decryption key is required when updating channels");
  } 
  
  const newKey = new PublicKey(request.newKey);
  const didDocument = await addKeyToDID(
    did,
    request.keyIdentifier,
    newKey,
    signer,
    payerOrUndefined,
    request.signCallback,
    request.cluster
  );

  const updateChannel = (channelAddress: PublicKeyBase58) => {
    return updateCEKAccount(
      did,
      signer as Keypair,
      payer,
      new PublicKey(channelAddress),
      newKey,
      request.signCallback,
      request.cluster
    )
  };

  const channelUpdateResults = await Promise.allSettled(request.channelsToUpdate.map(updateChannel));
  
  debug(channelUpdateResults);
  
  return didDocument;
};
