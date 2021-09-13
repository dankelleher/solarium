import { VerificationMethod } from 'did-resolver/src/resolver';
import { DIDDocument } from 'did-resolver';
import { isPublicKey, makeKeypair, PrivateKey } from '../util';
import { randomBytes } from '@stablelib/random';
import {
  x25519xc20pKeyWrap,
  x25519xc20pKeyUnwrap,
  XC20P_IV_LENGTH,
  XC20P_TAG_LENGTH,
  xc20pDecrypter,
  xc20pEncrypter,
} from './xc20pEncryption';

import * as u8a from 'uint8arrays';

import { convertPublicKey, convertSecretKey } from 'ed2curve-esm';
import { PublicKey } from '@solana/web3.js';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToString,
  stringToBytes,
  base58ToBytes,
  bytesToBase58,
} from './utils';
import { EncryptedKey, kidToBytes, UserPubKey } from '../UserDetails';
import {
  VM_TYPE_ED25519VERIFICATIONKEY2018,
  VM_TYPE_X25519KEYAGREEMENTKEY2019,
} from '../constants';
import { RandomSource } from '@stablelib/random/source/index';
import { generateKeyPair, SECRET_KEY_LENGTH } from '@stablelib/x25519';
import { getDocument } from '../did/get';

export type CEK = Uint8Array;
export const CEK_SIZE = 32

export type UserPrivateKey = Uint8Array;

type UserKeyPair = {
  userPubKey: UserPubKey;
  encryptedPrivateKeys: EncryptedKey[];
};

/**
 * Solarium CEKs are 32 byte symmetric keys
 * @param prng
 */
// TODO: Remove export?
export const generateCEK = (prng?: RandomSource): CEK => {
  return randomBytes(CEK_SIZE, prng);
};

/**
 * Solarium UserKeys are an x25519 key-pair
 */
// TODO: Remove export?
export const generateUserKey = (prng?: RandomSource):[UserPrivateKey,UserPubKey] => {
  const userKey = generateKeyPair(prng);
  return [userKey.secretKey, userKey.publicKey]
};

// given a key or reference to a key in a DID, return the key itself
const getVerificationMethod = (
  vmOrRef: VerificationMethod | string,
  document: DIDDocument
): VerificationMethod => {
  if (Object.prototype.hasOwnProperty.call(vmOrRef, 'id'))
    return vmOrRef as VerificationMethod;

  const foundKey = (document.verificationMethod || []).find(
    key => key.id === vmOrRef
  );

  if (!foundKey) throw new Error(`Missing key ${vmOrRef}`);
  return foundKey;
};

export const encryptCEKForUserKey = async (
  cek: CEK,
  userkey: UserPubKey
): Promise<EncryptedKey> => {
  const kwResult = await x25519xc20pKeyWrap(userkey)(cek);

  return new EncryptedKey(
    kidToBytes('UserKey'), // TODO: What should be use here? last digits of did identifier?
    kwResult.iv,
    kwResult.tag,
    kwResult.epPubKey,
    kwResult.encryptedKey);
};




/**
 * Generates a public and private keypair for a DID, and encrypts the private key
 * with every key in the DID.
 * @param didDocument
 */
export const createEncryptedUserKeyPair = async (didDocument: DIDDocument):Promise<UserKeyPair> => {
  const [userPrivateKey, userPubKey] = generateUserKey();

  const encryptedPrivateKeys = await encryptUserKeyForDidDocument(userPrivateKey, didDocument)

  return {
    userPubKey,
    encryptedPrivateKeys: encryptedPrivateKeys || []
  }

}

export const encryptUserKeyForDidDocument = async (secretKey: UserPrivateKey, didDocument: DIDDocument):Promise<EncryptedKey[]> => {
  console.log(JSON.stringify(didDocument))

  const getIDsAndKeys = (methods: VerificationMethod[]) => methods
    .filter(method => method.type === VM_TYPE_X25519KEYAGREEMENTKEY2019) // only apply to X25519
    .filter(method => !!method.publicKeyBase58) // we currently only support keys in base58
    .map(method => ({
      id: method.id,
      pub: method.publicKeyBase58
    })) as {id: string, pub: string}[]

  return encryptUserKeyForKeys(secretKey, getIDsAndKeys(didDocument.verificationMethod || []))
}

/**
 * Generates a public and private keypair for a set of keys, and encrypts the private key
 * with every key in the DID.
 * @param keys
 */
export const encryptUserKeyForKeys = async (secretKey: UserPrivateKey,
                                             verificationMethods: {id: string, pub: string}[]):Promise<EncryptedKey[]> => {

  const encryptedPrivateKeys = await Promise.all(verificationMethods.map(async vm => {
    const kwResult = await x25519xc20pKeyWrap(base58ToBytes(vm.pub))(secretKey);
    return new EncryptedKey(
      kidToBytes(vm.id),
      kwResult.iv,
      kwResult.tag,
      kwResult.epPubKey,
      kwResult.encryptedKey);
  }))

  return encryptedPrivateKeys
}

// Find the UserKey encrypted with a particular key, and decrypt it
export const decryptUserKey = async (
  encryptedUserKeys: EncryptedKey[],
  kid: Uint8Array,
  key: PrivateKey
): Promise<UserPrivateKey> => {
  // find the encrypted CEK for the key
  const encryptedUserKey = encryptedUserKeys.find(
    k => bytesToBase64(k.kid) === bytesToBase64(kid)
  );

  if (!encryptedUserKey) throw new Error(`No encrypted UserKey found for key ${kid}`);

  return decryptKeyWrap(encryptedUserKey, convertToX25519SecretKey(key));
};

// Create a new CEK and encrypt it for the DID
export const createEncryptedCEK = async (
  userkey: UserPubKey
): Promise<EncryptedKey> => {
  const cek = generateCEK();
  return encryptCEKForUserKey(cek, userkey);
};


export const convertToX25519SecretKey = (secretKey: PrivateKey): Uint8Array => {
  // convert to universal UIntArray
  const ed25519Key = makeKeypair(secretKey).secretKey;

  // The key is used both for Ed25519 signing and x25519 ECDH encryption
  // the two different protocols use the same curve (Curve25519) but
  // different key formats. Specifically Ed25519 uses a 64 byte secret key
  // (which is the same format used by Solana), which is in fact a keypair
  // i.e. combination of the secret and public key, whereas x25519 uses a 32 byte
  // secret key. In order to use the same key for both, we convert here
  // from Ed25519 to x25519 format.
  return convertSecretKey(ed25519Key);
}

/**
 * Decrypt an encrypted CEK for the with the key that was used to encrypt it
 * @param encryptedKey
 * @param key -- secret key in x25519 (32bit) format
 */
export const decryptKeyWrap = async (
  encryptedKey: EncryptedKey,
  secretKey: Uint8Array
): Promise<CEK | UserPrivateKey> => {
  // decode information from CEKData
  // iv (24), tag (16), epk PubKey (rest)
  // TODO @martin just hacked together to get things compiling - please check
  const { kiv: iv, keyTag: tag, ephemeralPubkey: epkPub } = encryptedKey;

  const cek = await x25519xc20pKeyUnwrap(secretKey)(
    encryptedKey.keyCiphertext,
    tag,
    iv,
    epkPub
  );
  if (cek === null) {
    throw Error('There was a problem decrypting the CEK');
  }

  return cek;
};

// Find the CEK encrypted with a particular key, and decrypt it
export const decryptCEKWithUserKey = async (
  encryptedCEK: EncryptedKey,
  userKey: UserPrivateKey
): Promise<CEK> => {
  return decryptKeyWrap(encryptedCEK, userKey);
};

// Encrypt a message with a CEK
export const encryptMessage = async (
  message: string,
  cek: CEK
): Promise<string> => {
  const encryptMessage = await xc20pEncrypter(cek)(stringToBytes(message));
  // iv (24), ciphertext (var), tag (16)
  const encodedEncMessage = bytesToBase64(
    u8a.concat([
      encryptMessage.iv,
      encryptMessage.ciphertext,
      encryptMessage.tag,
    ])
  );

  return encodedEncMessage;
};

// Decrypt a message with the CEK used to encrypt it
export const decryptMessage = async (
  encryptedMessage: string,
  cek: CEK
): Promise<string> => {
  const encMessage = base64ToBytes(encryptedMessage);
  // iv (24), ciphertext (var), tag (16)
  const iv = encMessage.subarray(0, XC20P_IV_LENGTH);
  const ciphertext = encMessage.subarray(XC20P_IV_LENGTH, -XC20P_TAG_LENGTH);
  const tag = encMessage.subarray(-XC20P_TAG_LENGTH);

  const binMessage = await xc20pDecrypter(cek)(ciphertext, tag, iv);
  if (binMessage === null) {
    throw new Error('There was an error decoding the message!');
  }

  const message = bytesToString(binMessage);

  return message;
};

// TODO: Discuss about moving constantly into did:sol resolver code.
// Solarium uses the x25519 ECDH protocol for e2e encryption,
// which expects a key in the x25519 format (32-byte secret key)
// and type 'X25519KeyAgreementKey2019'.
// 'Sparse' DID documents on solana have an ed25519 key with the type
// 'Ed25519VerificationKey2018' by default, as this is the key type
// used to sign solana transactions. These keys are compatible with
// x25519, but require format conversion. So *unless a keyAgreement key exists*
// on the document, we artificially augment the document to include
// the converted key. This saves space on chain by avoiding the need
// to have the same key stored in two formats.
export const augmentDIDDocument = (didDocument: DIDDocument): DIDDocument => {
  // key agreement key already exists, so we can use it
  if (didDocument.keyAgreement && didDocument.keyAgreement.length)
    return didDocument;

  if (
    !didDocument.verificationMethod ||
    !didDocument.verificationMethod.length
  ) {
    throw Error(
      'Cannot augment DID document for x25519. The document has no keys'
    );
  }

  const keyAgreementKeys = didDocument.verificationMethod
    .filter(key => key.type === VM_TYPE_ED25519VERIFICATIONKEY2018) // only apply to Ed25519
    .filter(key => !!key.publicKeyBase58) // we currently only support keys in base58
    .map(key => ({
      ...key,
      id: key.id + '_keyAgreement',
      type: VM_TYPE_X25519KEYAGREEMENTKEY2019,
      publicKeyBase58: bytesToBase58(
        convertPublicKey(base58ToBytes(key.publicKeyBase58 as string))
      ),
    }));

  // add the new key to the document
  return {
    ...didDocument,
    publicKey: [...didDocument.verificationMethod, ...keyAgreementKeys],
    verificationMethod: [
      ...didDocument.verificationMethod,
      ...keyAgreementKeys,
    ],
    keyAgreement: keyAgreementKeys.map(key => key.id),
  };
};

// Given a private key, find the ID of the associated public key on the DID
// Note, this needs to operate on the augmented DIDDocument Version
export const findVerificationMethodForKey = (
  didDoc: DIDDocument,
  key: PrivateKey | PublicKey
): VerificationMethod | undefined => {
  const augmentedDIDDoc = augmentDIDDocument(didDoc);

  if (!isPublicKey(key)) {
    const keypair = makeKeypair(key);
    key = keypair.publicKey;
  }
  // operate on x25519 curve PubKey
  const pubkey = bytesToBase58(convertPublicKey(key.toBytes()));

  const foundVerificationMethod = (
    augmentedDIDDoc.verificationMethod || []
  ).find(verificationMethod => verificationMethod.publicKeyBase58 === pubkey);

  return foundVerificationMethod;
};
