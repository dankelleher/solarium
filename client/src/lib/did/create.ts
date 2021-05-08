import {register, resolve} from '@identity.com/sol-did-client';
import {PublicKey, Account} from "@solana/web3.js";
import {DEFAULT_CLUSTER} from "../constants";
import {DIDDocument} from "did-resolver";

export const create = async (owner: PublicKey, payer: Account):Promise<DIDDocument> => {
  const did = await register({
    payer: payer.secretKey,
    owner: owner.toBase58(),
    cluster: DEFAULT_CLUSTER
  });

  return resolve(did);
}