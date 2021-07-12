import { DIDDocument } from 'did-resolver';
import { resolve } from '@identity.com/sol-did-client';

const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
type CacheEntry = { expiry: number; document: DIDDocument };
const cache: Record<string, CacheEntry> = {};
export const cachedResolve = async (
  did: string,
  skipCache: boolean
): Promise<DIDDocument> => {
  const entry = cache[did];
  if (!skipCache && entry && entry.expiry > Date.now()) return entry.document;

  try {
    const document = await resolve(did);

    updateCache(did, document);

    return document;
  } catch (error) {
    throw error;
  }
};

export const updateCache = (did: string, document: DIDDocument): void => {
  cache[did] = { expiry: Date.now() + DEFAULT_CACHE_TTL_MS, document };
};

export const evictCache = (did: string): void => {
  delete cache[did];
};
