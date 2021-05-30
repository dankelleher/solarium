import { keyToIdentifier, resolve } from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import { currentCluster, ExtendedCluster } from '../util';

import { memoizeWith, identity } from 'ramda';

const memoizedResolve = memoizeWith(identity, resolve);

export const get = async (
  authority: PublicKey,
  cluster?: ExtendedCluster
): Promise<DIDDocument> => {
  const didForAuthority = await keyToIdentifier(
    authority,
    currentCluster(cluster)
  );
  return resolve(didForAuthority);
};

export const getDocument = async (did:string): Promise<DIDDocument> => memoizedResolve(did);