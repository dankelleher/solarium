import {DIDDocument, VerificationMethod} from "did-resolver";
import {EncryptedKey, UserPubKey} from "../UserDetails";
import {PublicKeyBase58} from "../util";
import {complement, filter, isNil, pipe, pluck} from "ramda";

type UserPrivateKey = Uint8Array; // TODO @martin
type UserKeyPair = { userPubKey: UserPubKey, encryptedPrivateKeys: EncryptedKey[] }

// TODO @martin
const generateUserKey = ():[UserPrivateKey,UserPubKey] => {
  // @ts-ignore
  return [undefined, undefined]
};

/**
 * Generates a public and private keypair for a DID, and encrypts the private key
 * with every key in the DID.
 * @param didDocument
 */
export const makeUserKeyPair = async (didDocument: DIDDocument):Promise<UserKeyPair> => {
  // TODO @martin note - we need to filter non-Ed25519VerificationKey2018 keys here officially
  const getKeys = pipe(
    pluck('publicKeyBase58') as ((keys: VerificationMethod[]) => (PublicKeyBase58 | undefined)[]),
    filter(complement(isNil)) as (<T>(keys: (T|undefined)[]) => T[])
  );
  
  return makeUserKeyPairForKeys(getKeys(didDocument.verificationMethod || []))
}

/**
 * Generates a public and private keypair for a set of keys, and encrypts the private key
 * with every key in the DID.
 * @param keys
 */
export const makeUserKeyPairForKeys = async (keys: PublicKeyBase58[]):Promise<UserKeyPair> => {
  // TODO @martin
  const [userPrivateKey, userPubKey] = await generateUserKey();

  const encryptedPrivateKeys = keys.map(key => {
    console.log("key", key);
    // TODO @martin
    // @ts-ignore
    return new EncryptedKey(undefined, undefined, undefined, undefined, undefined);
  })

  return {
    userPubKey,
    encryptedPrivateKeys: encryptedPrivateKeys || []
  }
} 