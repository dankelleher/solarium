import { resolve } from '@identity.com/sol-did-client';
import {augmentDIDDocument} from "./SolariumCrypto";
import {VerificationMethod} from "did-resolver/src/resolver";
import {DIDDocument} from "did-resolver";
import {CEKData} from "../solana/models/CEKData";
import {makeKeypair, PrivateKey} from "../util";
import {Channel} from "../Channel";

export type CEK = {};

// Create a CEK for a new channel
export const generateCEK = async ():Promise<CEK> => {
  // TODO generate
  return Promise.resolve({});
}

// given a key or reference to a key in a DID, return the key itself
const getVerificationMethod = (vmOrRef: VerificationMethod | string, document: DIDDocument):VerificationMethod => {
  if (Object.prototype.hasOwnProperty.call(vmOrRef, 'id')) return vmOrRef as VerificationMethod;

  const foundKey = (document.verificationMethod || []).find(key => 
    key.id === vmOrRef
    ||
    key.id === (vmOrRef as string).replace('_keyAgreement','') // hack - see augmentDIDDocument
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
  // TODO encrypt cek
  return new CEKData({
    kid: key.id,
    header: "TODO",
    encryptedKey: "TODO"
  });
};

// Given an unencrypted channel CEK, encrypt it for a DID Document
export const encryptCEKForDIDDocument = async (cek: CEK, didDocument:DIDDocument):Promise<CEKData[]> => {
  const encryptedCEKPromises = (didDocument.keyAgreement || []).map(
    async (keyOrRef):Promise<CEKData> => {
      const key = getVerificationMethod(keyOrRef, didDocument);
      return encryptCEKForVerificationMethod(cek, key);
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

// Given a private key, find the ID of the associated public key on the DID
export const findKIDForKey = (did: DIDDocument, key: PrivateKey):string | undefined => {
  const keypair = makeKeypair(key);
  const pubkey = keypair.publicKey.toBase58();
  
  const foundVerificationMethod = (did.verificationMethod || [])
    .find(verificationMethod => verificationMethod.publicKeyBase58 === pubkey);
  
  return foundVerificationMethod?.id;
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
  const fromKID = findKIDForKey(fromDIDDocument, fromPrivateKey);
  
  if (!fromKID) throw new Error("Private key does not match any key in the DID");
  
  const cek = await decryptCEKs(encryptedCEK, fromKID, fromPrivateKey);
  
  return encryptCEKForDID(cek, toDID);
}