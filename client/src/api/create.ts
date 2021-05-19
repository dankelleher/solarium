import { PublicKey } from '@solana/web3.js';
import { CreateRequest, pubkeyOf, toSolanaKeyMaterial } from '../lib/util';
import { Inbox } from '../lib/Inbox';
import * as service from '../service/create';

/**
 * Creates an inbox
 * @param request
 */
export const create = async (request: CreateRequest): Promise<Inbox> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const owner = request.owner ? new PublicKey(request.owner) : pubkeyOf(payer);
  return service.create(owner, payer, request.signCallback, request.cluster);
};
