import {keyToIdentifier, resolve} from '@identity.com/sol-did-client';
import {PublicKey} from "@solana/web3.js";
import {DIDDocument} from "did-resolver";
import {currentCluster} from "../util";

export const get = async (authority: PublicKey):Promise<DIDDocument> => {
  const didForAuthority = await keyToIdentifier(authority, currentCluster())
  return resolve(didForAuthority);
};