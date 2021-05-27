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

/**
 * Add an owner to an inbox
 * @param request
 */
export const addKey = async (request: AddKeyRequest): Promise<DIDDocument> => {
  const did = request.ownerDID || (await didFromKey(request));
  const payer = toSolanaKeyMaterial(request.payer);
  // The API requires a payer either as a keypair or a pubkey but
  // In this case, the payer must either be a keypair or not present at all,
  // since the payer is only needed when request.signCallback is missing
  // this is a messy API which needs to be cleaned up TODO
  const payerOrUndefined = isKeypair(payer) ? payer : undefined;
  const signer = (request.signer && makeKeypair(request.signer)) as
    | Keypair
    | undefined;
  const signerKey = signer || pubkeyOf(payer);
  const newKey = new PublicKey(request.newKey);
  const didDocument = await addKeyToDID(
    did,
    request.keyIdentifier,
    newKey,
    signerKey,
    payerOrUndefined,
    request.signCallback,
    request.cluster
  );

  const updateChannel = (channelAddress: PublicKeyBase58) => {
    return updateCEKAccount(
      signerKey,
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
