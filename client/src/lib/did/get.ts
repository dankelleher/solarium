import { keyToIdentifier, resolve } from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import { currentCluster, ExtendedCluster } from '../util';
import { SolariumCache } from '../cache';

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

export const didCache = new SolariumCache<
  DIDDocument,
  (key: string) => Promise<DIDDocument>
>(resolve);
export const getDocument = async (
  did: string,
  skipCache = false
): Promise<DIDDocument> => didCache.load(did, skipCache);
