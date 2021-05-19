import { keyToIdentifier, resolve } from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { DIDDocument } from 'did-resolver';
import { currentCluster, ExtendedCluster } from '../util';

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
