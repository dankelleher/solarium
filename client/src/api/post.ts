import {
  currentCluster,
  isKeypair,
  makeKeypair,
  PostDirectRequest,
  PostRequest,
  pubkeyOf,
  toSolanaKeyMaterial,
} from '../lib/util';
import * as service from '../service/post';
import { keyToIdentifier } from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { SolanaUtil } from '../lib/solana/solanaUtil';

/**
 * Post a message to a group channel
 * @param request
 */
export const post = async (request: PostRequest): Promise<void> => {
  const connection = SolanaUtil.getConnection(request.cluster);
  const payer = toSolanaKeyMaterial(request.payer);

  // The API requires a payer either as a keypair or a pubkey but
  // In this case, the payer must either be a keypair or not present at all,
  // since the payer is only needed when request.signCallback is missing
  // this is a messy API which needs to be cleaned up TODO
  const payerOrUndefined = isKeypair(payer) ? payer : undefined;

  const signer = makeKeypair(request.signer);
  const senderDID =
    request.senderDID ||
    (await keyToIdentifier(pubkeyOf(payer), currentCluster(request.cluster)));
  return service.post(
    connection,
    senderDID,
    new PublicKey(request.channel),
    request.message,
    signer,
    payerOrUndefined,
    request.signCallback,
    request.cluster
  );
};

/**
 * Post a message to a direct channel
 * @param request
 */
export const postDirect = async (request: PostDirectRequest): Promise<void> => {
  const connection = SolanaUtil.getConnection(request.cluster);
  const payer = toSolanaKeyMaterial(request.payer);

  // The API requires a payer either as a keypair or a pubkey but
  // In this case, the payer must either be a keypair or not present at all,
  // since the payer is only needed when request.signCallback is missing
  // this is a messy API which needs to be cleaned up TODO
  const payerOrUndefined = isKeypair(payer) ? payer : undefined;

  const signer = makeKeypair(request.signer);
  const senderDID =
    request.senderDID ||
    (await keyToIdentifier(pubkeyOf(payer), currentCluster(request.cluster)));
  return service.postDirect(
    connection,
    senderDID,
    request.recipientDID,
    request.message,
    signer,
    payerOrUndefined,
    request.signCallback,
    request.cluster
  );
};
