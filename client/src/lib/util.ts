import { Keypair, Cluster, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { decode, encode } from 'bs58';
import {
  ClusterType,
  DecentralizedIdentifier,
} from '@identity.com/sol-did-client';
import { DEFAULT_CLUSTER } from './constants';
import { SignCallback } from './wallet';

// a 64-byte private key on the X25519 curve.
// In string form it is base58-encoded
export type PrivateKey = number[] | string | Buffer | Uint8Array;
export type PublicKeyBase58 = string;

export const privateKeyIsArray = (
  privateKey: PrivateKey
): privateKey is number[] => Array.isArray(privateKey);
export const privateKeyIsString = (
  privateKey: PrivateKey
): privateKey is string => typeof privateKey === 'string';
export const privateKeyIsBuffer = (
  privateKey: PrivateKey
): privateKey is Buffer => Buffer.isBuffer(privateKey);
export const privateKeyIsUint8Array = (
  privateKey: PrivateKey
): privateKey is Uint8Array => privateKey instanceof Uint8Array;

/**
 * Create a Solana keypair object from an x25519 private key
 * @param privateKey
 */
export const makeKeypair = (privateKey: PrivateKey): Keypair => {
  if (privateKeyIsArray(privateKey))
    return Keypair.fromSecretKey(Buffer.from(privateKey));

  if (privateKeyIsUint8Array(privateKey) || privateKeyIsBuffer(privateKey))
    return Keypair.fromSecretKey(privateKey);

  if (privateKeyIsString(privateKey)) {
    const privateKeyHex = decode(privateKey);
    return Keypair.fromSecretKey(privateKeyHex);
  }

  throw new Error('Incompatible private key format');
};

/**
 * Given a private key on the x25519 curve, get its public key
 * @param privateKey
 */
export const getPublicKey = (privateKey: PrivateKey): PublicKey =>
  makeKeypair(privateKey).publicKey;

type EncodedKeyPair = {
  secretKey: string;
  publicKey: string;
};
export const generateKeypair = (): EncodedKeyPair => {
  const keypair = Keypair.generate();
  return {
    secretKey: encode(keypair.secretKey),
    publicKey: keypair.publicKey.toBase58(),
  };
};

export type ExtendedCluster = Cluster | 'localnet';
export const getClusterEndpoint = (cluster?: ExtendedCluster) => {
  if (!cluster) return currentCluster().solanaUrl();

  switch (cluster) {
    case 'localnet':
      return 'http://localhost:8899';
    default:
      return clusterApiUrl(cluster);
  }
};

type KeyMaterial = Keypair | PrivateKey | PublicKeyBase58 | PublicKey;

export const toSolanaKeyMaterial = (k: KeyMaterial): Keypair | PublicKey => {
  if (isKeypair(k) || isPublicKey(k)) return k;

  try {
    return makeKeypair(k);
  } catch {
    return new PublicKey(k);
  }
};

export type SolanaRequest = {
  cluster?: ExtendedCluster;
};

export type TransactionRequest = SolanaRequest & {
  payer: KeyMaterial;
  signCallback?: SignCallback;
};

export type CreateRequest = TransactionRequest & {
  owner?: PublicKeyBase58;
};

export type CloseRequest = TransactionRequest & {
  ownerDID: string;
  signer?: PrivateKey;
};

export type PostRequest = TransactionRequest & {
  senderDID?: string;
  signer: PrivateKey;
  ownerDID: string;
  message: string;
};

export type ReadRequest = SolanaRequest & {
  ownerDID?: string;
  owner?: PublicKeyBase58;
  decryptionKey: PrivateKey;
};

export type GetRequest = SolanaRequest & {
  ownerDID?: string;
  owner?: PublicKeyBase58;
  decryptionKey?: PrivateKey;
};

export type AddKeyRequest = TransactionRequest & {
  ownerDID?: string;
  signer?: PrivateKey;
  newKey: PublicKeyBase58;
  keyIdentifier: string;
};

export const didToPublicKey = (did: string) =>
  DecentralizedIdentifier.parse(did).pubkey.toPublicKey();

export const currentCluster = (cluster?: ExtendedCluster) =>
  cluster
    ? ClusterType.parse(cluster)
    : process.env.CLUSTER
    ? ClusterType.parse(process.env.CLUSTER)
    : DEFAULT_CLUSTER;

// Typescript does not allow you to pass a possibly undefined value into a spread parameter
// and have it behave as if it is not there,
// in other words, if you have ...a as a parameter, and you pass in (undefined), this function
// will assign a to []
export const arrayOf = <T>(...things: (T | undefined)[]): T[] =>
  things.filter(t => t !== undefined) as T[];

export const isKeypair = (k: KeyMaterial): k is Keypair => k instanceof Keypair;
export const isPublicKey = (k: KeyMaterial): k is PublicKey =>
  k instanceof PublicKey;
export const pubkeyOf = (k: Keypair | PublicKey): PublicKey =>
  isKeypair(k) ? k.publicKey : k;
