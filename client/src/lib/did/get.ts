import {keyToIdentifier, resolve} from '@identity.com/sol-did-client';
import {PublicKey} from "@solana/web3.js";
import {DEFAULT_CLUSTER} from "../constants";
import {DIDDocument} from "did-resolver";

export const get = async (authority: PublicKey):Promise<DIDDocument> => {
  const didForAuthority = await keyToIdentifier(authority, DEFAULT_CLUSTER)
  return resolve(didForAuthority);
};