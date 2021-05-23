import { PublicKey } from '@solana/web3.js';
import { CreateRequest, pubkeyOf, toSolanaKeyMaterial } from '../lib/util';
import * as service from '../service/create';
import {ChannelData} from "../lib/solana/models/ChannelData";

/**
 * Creates an inbox
 * @param request
 */
export const create = async (request: CreateRequest): Promise<ChannelData> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const owner = request.owner ? new PublicKey(request.owner) : pubkeyOf(payer);
  return service.createChannel(owner, payer, request.name, request.signCallback, request.cluster);
};
