import { Cluster, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
import { decode, encode } from 'bs58';
import {
  ClusterType,
  DecentralizedIdentifier,
} from '@identity.com/sol-did-client';
import { DEFAULT_CLUSTER } from './constants';
import { SignCallback } from './wallet';
import Debug from 'debug';
import { AddressBook } from './UserDetails';
import { VerificationMethod } from 'did-resolver';

export const debug = Debug('solarium-js');

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

export type DIDKey = { key: PublicKeyBase58; identifier: string };
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
export const getClusterEndpoint = (cluster?: ExtendedCluster): string => {
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
  owner?: KeyMaterial;
  name: string;
};

export type CreateDirectRequest = TransactionRequest & {
  owner?: KeyMaterial;
  inviteeDID: string;
};

export type CloseRequest = TransactionRequest & {
  ownerDID: string;
  signer?: PrivateKey;
};

export type PostRequest = TransactionRequest & {
  senderDID?: string;
  signer: PrivateKey;
  channel: PublicKeyBase58;
  message: string;
};

export type PostDirectRequest = TransactionRequest & {
  senderDID?: string;
  signer: PrivateKey;
  recipientDID: string;
  message: string;
};

export type ReadRequest = SolanaRequest & {
  memberDID?: string;
  member?: PublicKeyBase58;
  decryptionKey: PrivateKey;
  channel: PublicKeyBase58;
};

export type GetRequest = SolanaRequest & {
  ownerDID?: string;
  owner?: PublicKeyBase58;
  decryptionKey?: PrivateKey;
  channel: PublicKeyBase58;
};

export type GetDirectRequest = SolanaRequest & {
  ownerDID?: string;
  partnerDID: string;
  owner?: PublicKeyBase58;
  decryptionKey?: PrivateKey;
};

export type AddKeyRequest = TransactionRequest & {
  ownerDID?: string;
  signer: KeyMaterial;
  newKey: PublicKeyBase58;
  keyIdentifier: string;
  channelsToUpdate: PublicKeyBase58[];
};

export type AddToChannelRequest = TransactionRequest & {
  ownerDID?: string;
  inviteeDID: string;
  decryptionKey: PrivateKey;
  channel: PublicKeyBase58;
};

export type CreateDIDRequest = TransactionRequest & {
  owner?: KeyMaterial;
  alias?: string;
  additionalKeys?: DIDKey[];
};

export type GetDIDRequest = SolanaRequest & {
  owner: PublicKeyBase58;
};

export type CreateUserDetailsRequest = TransactionRequest & {
  ownerDID?: string;
  owner?: KeyMaterial;
  alias: string;
  size?: number;
};

export type UpdateUserDetailsRequest = TransactionRequest & {
  ownerDID?: string;
  owner?: KeyMaterial;
  alias?: string;
  addressBook?: AddressBook;
};

export type GetUserDetailsRequest = SolanaRequest & {
  did: string;
};

export const didToPublicKey = (did: string): PublicKey =>
  DecentralizedIdentifier.parse(did).pubkey.toPublicKey();

export const currentCluster = (cluster?: ExtendedCluster): ClusterType =>
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

export const isString = (value): value is string =>
  typeof value === 'string' || value instanceof String;

export const keyToVerificationMethod = (
  did: string,
  didKey: DIDKey
): VerificationMethod => ({
  id: did + '#' + didKey.identifier,
  type: 'Ed25519VerificationKey2018',
  controller: did,
  publicKeyBase58: didKey.key,
});
