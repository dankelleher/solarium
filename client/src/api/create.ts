import { PublicKey } from '@solana/web3.js';
import {CreateDirectRequest, CreateRequest, pubkeyOf, toSolanaKeyMaterial} from '../lib/util';
import * as service from '../service/create';
import {ChannelData} from "../lib/solana/models/ChannelData";
import {Channel} from "../lib/Channel";

/**
 * Creates a group channel
 * @param request
 */
export const create = async (request: CreateRequest): Promise<Channel> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const owner = request.owner ? toSolanaKeyMaterial(request.owner) : pubkeyOf(payer);
  return service.createChannel(owner, payer, request.name, request.signCallback, request.cluster);
};

/**
 * Creates a direct chanel
 * @param request
 */
export const createDirect = async (request: CreateDirectRequest): Promise<Channel> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const owner = request.owner ? toSolanaKeyMaterial(request.owner) : pubkeyOf(payer);
  return service.createDirectChannel(owner, payer, request.inviteeDID, request.signCallback, request.cluster);
};