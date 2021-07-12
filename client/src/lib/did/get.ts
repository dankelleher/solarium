import { keyToIdentifier } from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import { currentCluster, ExtendedCluster } from '../util';
import { cachedResolve } from './cache';

export const get = async (
  authority: PublicKey,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  const didForAuthority = await keyToIdentifier(
    authority,
    currentCluster(cluster)
  );
  return getDocument(didForAuthority);
};

export const getDocument = async (
  did: string,
  skipCache = false
): Promise<DIDDocument> => cachedResolve(did, skipCache);
