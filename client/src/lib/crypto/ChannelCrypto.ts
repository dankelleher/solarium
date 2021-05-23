import { resolve } from '@identity.com/sol-did-client';
import {augmentDIDDocument} from "./SolariumCrypto";
import {VerificationMethod} from "did-resolver/src/resolver";
import {DIDDocument} from "did-resolver";
import {CEKData} from "../solana/models/CEKData";
import {PrivateKey} from "../util";

type CEK = {};

// Create a CEK for a new channel
export const generateCEK = async ():Promise<CEK> => {
  // TODO generate
  return Promise.resolve({});
}

// given a key or reference to a key in a DID, return the key itself
const getKey = (keyOrRef: VerificationMethod | string, document: DIDDocument):VerificationMethod => {
  if (Object.prototype.hasOwnProperty.call(keyOrRef, 'id')) return keyOrRef as VerificationMethod;

  const foundKey = (document.verificationMethod || []).find(key => 
    key.id === keyOrRef
    ||
    key.id === (keyOrRef as string).replace('_keyAgreement','') // hack - see augmentDIDDocument
  );

  if (!foundKey) throw new Error(`Missing key ${keyOrRef}`);

  return foundKey;
}

// Given an unecrypted channel CEK, encrypt it for a DID
export const encryptCEKForDID = async (cek: CEK, did:string):Promise<CEKData[]> => {
  // TODO add cache here
  const didDocument = await resolve(did);
  const augmentedDIDDocument = augmentDIDDocument(didDocument);
  
  return encryptCEKForDIDDocument(cek, augmentedDIDDocument)
}

// Given an unecrypted channel CEK, encrypt it for a DID Document
export const encryptCEKForDIDDocument = async (cek: CEK, didDocument:DIDDocument):Promise<CEKData[]> => {
  const encryptedCEKPromises = (didDocument.keyAgreement || []).map(
    async (keyOrRef):Promise<CEKData> => {
      const key = getKey(keyOrRef, didDocument);
      console.log(`Encrypting ${cek} with ${key}`);
      // TODO encrypt cek
      return new CEKData({
        kid: key.id,
        header: "TODO",
        encryptedKey: "TODO"
      });
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
  // TODO Decrypt
  return {};
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
  console.log(`Encrypting ${message} with ${cek}`);  // TODO remove once done to avoid leaking private key
  // TODO for now return base64, but we can fix that to be a byte array
  return message; // TODO placeholder until encryption is in
}

// Decrypt a message with the CEK used to encrypt it
export const decryptMessage = async(encryptedMessage: string, cek: CEK):Promise<string> => {
  console.log(`Decrypting ${encryptedMessage} with ${cek}`);  // TODO remove once done to avoid leaking private key
  return encryptedMessage; // TODO placeholder until decryption is in
}