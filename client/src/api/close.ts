import { CloseRequest, makeKeypair, toSolanaKeyMaterial } from '../lib/util';
import * as service from '../service/close';
import { Keypair } from '@solana/web3.js';

/**
 * Deletes an inbox
 * @param request
 */
export const close = async (request: CloseRequest): Promise<void> => {
  const payer = toSolanaKeyMaterial(request.payer);
  const signer = (request.signer && makeKeypair(request.signer)) as
    | Keypair
    | undefined;

  await service.close(
    request.ownerDID,
    payer,
    signer,
    undefined,
    request.signCallback,
    request.cluster
  );
};
