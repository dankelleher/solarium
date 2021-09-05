import {DIDDocument, VerificationMethod} from "did-resolver";
import {EncryptedKey, Kid, KID_SIZE, UserPubKey} from "../UserDetails";
import {PublicKeyBase58} from "../util";
import {complement, filter, isNil, pipe, pluck} from "ramda";
import {generateKeyPair} from "@stablelib/x25519";
import {x25519xc20pKeyWrap} from "./xc20pEncryption";
import {base58ToBytes} from "./utils";

type UserPrivateKey = Uint8Array;
type UserKeyPair = { userPubKey: UserPubKey, encryptedPrivateKeys: EncryptedKey[] }

/**
 * Solarium UserKeys are an x25519 key-pair
 */
const generateUserKey = ():[UserPrivateKey,UserPubKey] => {
  const userKey = generateKeyPair();
  return [userKey.secretKey, userKey.publicKey]
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
  const [userPrivateKey, userPubKey] = generateUserKey();

  const encryptedPrivateKeys = await Promise.all(keys.map(async key => {
    const kwResult = await x25519xc20pKeyWrap(base58ToBytes(key))(userPrivateKey);
    return new EncryptedKey(
      kIdFromPublicKey(userPubKey),
      kwResult.iv,
      kwResult.tag,
      kwResult.epPubKey,
      kwResult.encryptedKey);
  }))

  return {
    userPubKey,
    encryptedPrivateKeys: encryptedPrivateKeys || []
  }
}

/**
 * Get KID from Public Key
 */
export const kIdFromPublicKey = (pub: UserPubKey): Kid => pub.subarray(0, KID_SIZE)