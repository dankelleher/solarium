import { resolve } from '@identity.com/sol-did-client';
import {VerificationMethod} from "did-resolver/src/resolver";
import {DIDDocument} from "did-resolver";
import {CEKData} from "../solana/models/CEKData";
import {isPublicKey, makeKeypair, PrivateKey} from "../util";
import { randomBytes } from '@stablelib/random'
import {x25519Decrypter, x25519Encrypter, xc20pDirDecrypter, xc20pDirEncrypter} from "./xc20pEncryption";
import {
  base58ToBytes,
  base64ToBytes,
  bytesToBase64,
  bytesToBase64url,
  bytesToString,
  stringToBytes,
} from "./util";
import * as u8a from 'uint8arrays'

import {Recipient} from "./JWE";
import { convertPublicKey, convertSecretKey } from 'ed2curve-esm';
import {decode, encode} from "bs58";
import {PublicKey} from "@solana/web3.js";

export type CEK = Uint8Array;

// Create a CEK for a new channel
export const generateCEK = async ():Promise<CEK> => {
  const cek = randomBytes(32)
  return Promise.resolve(cek);
}

// given a key or reference to a key in a DID, return the key itself
const getVerificationMethod = (vmOrRef: VerificationMethod | string, document: DIDDocument):VerificationMethod => {
  if (Object.prototype.hasOwnProperty.call(vmOrRef, 'id')) return vmOrRef as VerificationMethod;

  const foundKey = (document.verificationMethod || []).find(key =>
    key.id === vmOrRef
  );

  if (!foundKey) throw new Error(`Missing key ${vmOrRef}`);

  return foundKey;
}

// Given an unecrypted channel CEK, encrypt it for a DID
export const encryptCEKForDID = async (cek: CEK, did:string):Promise<CEKData[]> => {
  // TODO add cache here
  const didDocument = await resolve(did);
  const augmentedDIDDocument = augmentDIDDocument(didDocument);

  return encryptCEKForDIDDocument(cek, augmentedDIDDocument)
}

export const encryptCEKForVerificationMethod = async (cek: CEK, key: VerificationMethod) => {
  console.log(`Encrypting ${cek} with ${key}`);

  if (!key.publicKeyBase58) {
    throw Error('Currently we expect the recipient key to be encoded as base58')
  }

  // @ts-ignore
  const recipient = await x25519Encrypter(base58ToBytes(key.publicKeyBase58), key.id).encryptCek(cek);

  // encode all header information within a string
  // Received: {"encrypted_key": "dDClXNoduuCOERuxcpocX5lz7e7jE_8n4P4sl6K5VCk", "header": {"alg": "ECDH-ES+XC20PKW", "epk": {"crv": "X25519", "kty": "OKP", "x": "rMHFFnBhe5o13OQlxhnSIhLDs2wKUpd9fQ5mHK_GG0I"}, "iv": "Lwinhb_oEmetqwMM6G7EHDoOdjG6IPeh", "kid": "key0", "tag": "Pu9P4DWQI8bIGHc5euAlvA"}, "kid": "key0"}
  // iv: bytesToBase64url(res.iv),
  //     tag: bytesToBase64url(res.tag),
  //     epk: { kty: 'OKP', crv, x: bytesToBase64url(epk.publicKey) }
  // header.iv + header.tag + header.epk.x
  const concatByteArray = u8a.concat([base64ToBytes(recipient.header.iv), base64ToBytes(recipient.header.tag), base64ToBytes(recipient.header.epk?.x)])
  const header = bytesToBase64(concatByteArray)

  return new CEKData({
    kid: key.id,
    header,
    encryptedKey: recipient.encrypted_key
  });
};

// Given an unencrypted channel CEK, encrypt it for a DID Document
export const encryptCEKForDIDDocument = async (cek: CEK, didDocument:DIDDocument):Promise<CEKData[]> => {
  const encryptedCEKPromises = (didDocument.keyAgreement || []).map(
    async (keyOrRef):Promise<CEKData> => {
      const verificationMethod = getVerificationMethod(keyOrRef, didDocument);
      return encryptCEKForVerificationMethod(cek, verificationMethod);
    }
  );

  return Promise.all(encryptedCEKPromises);
}

// Create a new CEK and encrypt it for the DID
export const createEncryptedCEK = async (did:string):Promise<CEKData[]> => {
  const cek = await generateCEK();
  return encryptCEKForDID(cek, did);
}

// Decrypt an encrypted CEK for the with the key that was used to encrypt it
export const decryptCEK = async (encryptedCEK: CEKData, key: PrivateKey):Promise<CEK> => {
  console.log(`Decrypting ${encryptedCEK} with ${key}`);  // TODO remove once done to avoid leaking private key

  // decode information from CEKData

  const encodedHeader = base64ToBytes(encryptedCEK.header)
  // iv (24), tag (16), epk PubKey (rest)
  const iv = encodedHeader.subarray(0, 24)
  const tag = encodedHeader.subarray(24, 24+16)
  const epkPub = encodedHeader.subarray(24+16)
  const alg = 'ECDH-ES+XC20PKW'
  const crv = 'X25519'

  const recipient: Recipient = {
    header: {
      alg,
      iv: bytesToBase64url(iv),
      tag: bytesToBase64url(tag),
      epk: { kty: 'OKP', crv, x: bytesToBase64url(epkPub) }
    },
    encrypted_key: encryptedCEK.encryptedKey
  }

  // normalise the key into an uint array
  const ed25519Key = makeKeypair(key).secretKey;

  // The key is used both for Ed25519 signing and x25519 ECDH encryption
  // the two different protocols use the same curve (Curve25519) but
  // different key formats. Specifically Ed25519 uses a 64 byte secret key
  // (which is the same format used by Solana), which is in fact a keypair
  // i.e. combination of the secret and public key, whereas x25519 uses a 32 byte
  // secret key. In order to use the same key for both, we convert here
  // from Ed25519 to x25519 format.
  const curve25519Key = convertSecretKey(ed25519Key);


  // @ts-ignore
  const cek = await x25519Decrypter(curve25519Key).decryptCek(recipient);
  if (cek === null) {
    throw Error('There was a problem decrypting the CEK')
  }

  return cek;
}

// Find the CEK encrypted with a particular key, and decrypt it
export const decryptCEKs = async (encryptedCEKs: CEKData[], kid: string, key: PrivateKey):Promise<CEK> => {
  // find the encrypted CEK for the key
  const encryptedCEK = encryptedCEKs.find(k => k.kid === kid);

  if (!encryptedCEK) throw new Error(`No encrypted CEK found for key ${kid}`);

  return decryptCEK(encryptedCEK, key);
}

// Encrypt a message with a CEK
export const encryptMessage = async(message: string, cek: CEK):Promise<string> => {
  console.log(`Encrypting ${message} with ${cek}`);   // TODO remove once done to avoid leaking private key

  const encryptMessage = await xc20pDirEncrypter(cek).encrypt(stringToBytes(message))
  // we return a single bytearray in base64
  // Static lengths:
  // iv (24), ciphertext (var), tag (16)
  const encodedEncMessage = bytesToBase64(u8a.concat([encryptMessage.iv, encryptMessage.ciphertext, encryptMessage.tag]))

  return encodedEncMessage;
}

// Decrypt a message with the CEK used to encrypt it
export const decryptMessage = async(encryptedMessage: string, cek: CEK):Promise<string> => {
  console.log(`Decrypting ${encryptedMessage} with ${cek}`);  // TODO remove once done to avoid leaking private key


  const encMessage = base64ToBytes(encryptedMessage)
  // iv (24), ciphertext (var), tag (16)
  const iv = encMessage.subarray(0, 24)
  const sealed = encMessage.subarray(24)

  const binMessage = await xc20pDirDecrypter(cek).decrypt(sealed, iv)
  if (binMessage === null) {
    throw new Error('There was an error decoding the message!')
  }

  const message = bytesToString(binMessage)

  return message;
}

// Given a private key, find the ID of the associated public key on the DID
// Note, this needs to operate on the augmented DIDDocument Version
export const findVerificationMethodForKey = (didDoc: DIDDocument, key: PrivateKey | PublicKey): VerificationMethod | undefined => {
  const augmentedDIDDoc = augmentDIDDocument(didDoc);

  if (!isPublicKey(key)) {
    const keypair = makeKeypair(key);
    key = keypair.publicKey
  }
  // operate on x25519 curve PubKey
  const pubkey = encode(convertPublicKey(key.toBytes()))

  const foundVerificationMethod = (augmentedDIDDoc.verificationMethod || [])
    .find(verificationMethod => verificationMethod.publicKeyBase58 === pubkey);

  return foundVerificationMethod;
}

// Given a cek encrypted for fromDID, and a private key for fromDID
// decrypt and reencrypt for toDID
export const reencryptCEKForDID = async (
  encryptedCEK: CEKData[],
  fromDID: string,
  fromPrivateKey: PrivateKey,
  toDID: string
):Promise<CEKData[]> => {
  // TODO add cache here
  const fromDIDDocument = await resolve(fromDID);
  const fromVerificationMethod = findVerificationMethodForKey(fromDIDDocument, fromPrivateKey);

  if (!fromVerificationMethod) throw new Error("Private key does not match any Verification Method in the DID");

  const cek = await decryptCEKs(encryptedCEK, fromVerificationMethod.id, fromPrivateKey);

  return encryptCEKForDID(cek, toDID);
}

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

  if (!didDocument.verificationMethod || !didDocument.verificationMethod.length) {
    throw Error(
        'Cannot augment DID document for x25519. The document has no keys'
    );
  }

  const keyAgreementKeys = didDocument.verificationMethod
      .filter(key => key.type === 'Ed25519VerificationKey2018') // only apply to Ed25519
      .filter(key => !!key.publicKeyBase58) // we currently only support keys in base58
      .map(key => ({
        ...key,
        id: key.id + '_keyAgreement',
        type: 'X25519KeyAgreementKey2019',
        publicKeyBase58: encode(
            convertPublicKey(decode(key.publicKeyBase58 as string))
        ),
      }));

  // add the new key to the document
  return {
    ...didDocument,
    publicKey: [...didDocument.verificationMethod, ...keyAgreementKeys],
    verificationMethod: [...didDocument.verificationMethod, ...keyAgreementKeys],
    keyAgreement: keyAgreementKeys.map(key => key.id),
  };
};
