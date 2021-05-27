import {
  AddToChannelRequest,
  currentCluster, GetDirectRequest, GetRequest,
  makeKeypair, pubkeyOf,
  PublicKeyBase58,
  ReadRequest, toSolanaKeyMaterial,
} from '../lib/util';
import * as service from '../service/addToChannel';
import { SolanaUtil } from '../lib/solana/solanaUtil';
import {
  DecentralizedIdentifier,
  keyToIdentifier,
} from '@identity.com/sol-did-client';
import { distinct, switchMap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { Channel } from '../lib/Channel';


const didFromKey = (request: AddToChannelRequest): Promise<string> => {
  if (request.ownerDID) return Promise.resolve(request.ownerDID);
  if (request.decryptionKey)
    return keyToIdentifier(
      makeKeypair(request.decryptionKey).publicKey,
      currentCluster(request.cluster)
    );
  if (request.payer)
    return keyToIdentifier(
      pubkeyOf(toSolanaKeyMaterial(request.payer)),
      currentCluster(request.cluster)
    );
  
  throw new Error(
    'Unable to obtain DID from request - set either the owner or decryption key'
  );
};

/**
 * Adds a DID to a channel
 * @param request
 */
export const addToChannel = async (request: AddToChannelRequest): Promise<void> => {
  const ownerDID = await didFromKey(request);

  await service.addToChannel(
    ownerDID,
    makeKeypair(request.decryptionKey),
    toSolanaKeyMaterial(request.payer),
    new PublicKey(request.channel),
    request.inviteeDID,
    request.signCallback,
    request.cluster
  );

};