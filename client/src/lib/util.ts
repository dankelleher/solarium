import {Account, Cluster, clusterApiUrl, PublicKey} from '@solana/web3.js';
import { decode, encode } from 'bs58';
import {DecentralizedIdentifier} from "@identity.com/sol-did-client";
import {DEFAULT_CLUSTER} from "./constants";

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
 * Create a Solana account object from an x25519 private key
 * @param privateKey
 */
export const makeAccount = (privateKey: PrivateKey): Account => {
  if (
    privateKeyIsArray(privateKey) ||
    privateKeyIsBuffer(privateKey) ||
    privateKeyIsUint8Array(privateKey)
  )
    return new Account(privateKey);
  if (privateKeyIsString(privateKey)) {
    const privateKeyHex = decode(privateKey);
    return new Account(privateKeyHex);
  }

  throw new Error('Incompatible private key format');
};

/**
 * Given a private key on the x25519 curve, get its public key
 * @param privateKey
 */
export const getPublicKey = (privateKey: PrivateKey): PublicKey =>
  makeAccount(privateKey).publicKey;

type EncodedKeyPair = {
  secretKey: string;
  publicKey: string;
};
export const generateKeypair = (): EncodedKeyPair => {
  const account = new Account();
  return {
    secretKey: encode(account.secretKey),
    publicKey: account.publicKey.toBase58(),
  };
};

type ExtendedCluster = Cluster | 'localnet' | 'civic'
export const getClusterEndpoint = (cluster?: ExtendedCluster) => {
  if (!cluster) return DEFAULT_CLUSTER.solanaUrl();
  
  switch (cluster) {
    case 'localnet': return 'http://localhost:8899';
    case 'civic': return 'http://ec2-3-238-152-85.compute-1.amazonaws.com:8899';
    default: return clusterApiUrl(cluster);
  } 
}

export type CreateRequest = {
  owner?: PublicKeyBase58,
  payer: PrivateKey
}

export type CloseRequest = {
  payer: PrivateKey,
  ownerDID: string,
  signer?: PrivateKey
}

export type PostRequest = {
  payer: PrivateKey,
  senderDID: string, 
  signer?: PrivateKey,
  ownerDID: string,
  message: string
}

export type ReadRequest = {
  ownerDID: string,
  ownerKey: PrivateKey
}

export const didToPublicKey = (did: string) => DecentralizedIdentifier.parse(did).pubkey.toPublicKey()