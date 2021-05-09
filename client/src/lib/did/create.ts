import {register, resolve} from '@identity.com/sol-did-client';
import {PublicKey, Keypair} from "@solana/web3.js";
import {DIDDocument} from "did-resolver";
import {currentCluster} from "../util";

export const create = async (owner: PublicKey, payer: Keypair):Promise<DIDDocument> => {
  const did = await register({
    payer: payer.secretKey,
    owner: owner.toBase58(),
    cluster: currentCluster()
  });

  return resolve(did);
}