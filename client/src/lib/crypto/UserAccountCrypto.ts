import {DIDDocument, VerificationMethod} from "did-resolver";
import {EncryptedKey, Kid, KID_SIZE, UserPubKey} from "../UserDetails";
import {generateKeyPair} from "@stablelib/x25519";
import {x25519xc20pKeyWrap} from "./xc20pEncryption";
import {base58ToBytes, bytesToBase64, stringToBytes} from "./utils";
import {PrivateKey} from "../util";
import {decryptKeyWrap} from "./ChannelCrypto";
import {VM_TYPE_X25519KEYAGREEMENTKEY2019} from "../constants";
import {RandomSource} from "@stablelib/random";

export type UserPrivateKey = Uint8Array;
type UserKeyPair = { userPubKey: UserPubKey, encryptedPrivateKeys: EncryptedKey[] }

/**
 * Solarium UserKeys are an x25519 key-pair
 */
const generateUserKey = (prng?: RandomSource):[UserPrivateKey,UserPubKey] => {
  const userKey = generateKeyPair(prng);
  return [userKey.secretKey, userKey.publicKey]
};

/**
 * Generates a public and private keypair for a DID, and encrypts the private key
 * with every key in the DID.
 * @param didDocument
 */
export const makeUserKeyPair = async (didDocument: DIDDocument):Promise<UserKeyPair> => {
  console.log(JSON.stringify(didDocument))

  const getIDsAndKeys = (methods: VerificationMethod[]) => methods
    .filter(method => method.type === VM_TYPE_X25519KEYAGREEMENTKEY2019) // only apply to X25519
    .filter(method => !!method.publicKeyBase58) // we currently only support keys in base58
    .map(method => ({
          id: method.id,
          pub: method.publicKeyBase58
    })) as {id: string, pub: string}[]
  
  return makeUserKeyPairForKeys(getIDsAndKeys(didDocument.verificationMethod || []))
}

/**
 * Generates a public and private keypair for a set of keys, and encrypts the private key
 * with every key in the DID.
 * @param keys
 */
export const makeUserKeyPairForKeys = async (verificationMethods: {id: string, pub: string}[]):Promise<UserKeyPair> => {
  console.log(JSON.stringify(verificationMethods))

  const [userPrivateKey, userPubKey] = generateUserKey();

  const encryptedPrivateKeys = await Promise.all(verificationMethods.map(async vm => {
    const kwResult = await x25519xc20pKeyWrap(base58ToBytes(vm.pub))(userPrivateKey);
    return new EncryptedKey(
      kidToBytes(vm.id),
      kwResult.iv,
      kwResult.tag,
      kwResult.epPubKey,
      kwResult.encryptedKey);
  }))

  console.log(JSON.stringify(encryptedPrivateKeys))

  return {
    userPubKey,
    encryptedPrivateKeys: encryptedPrivateKeys || []
  }
}

/**
 * VM ID after "#", truncated to max 8 bytes
 * Shorter Strings also have to be at least 8 bytes long
 * @param kid
 */
export const kidToBytes = (kid: string): Kid => {
  // 0-init
  const kidBytes = new Uint8Array(KID_SIZE);
  kidBytes.set(stringToBytes(kid.substring(kid.indexOf('#') + 1)).slice(0, KID_SIZE))
  return kidBytes
}

// Find the UserKey encrypted with a particular key, and decrypt it
export const decrypUserKey = async (
  encryptedUserKeys: EncryptedKey[],
  kid: Uint8Array,
  key: PrivateKey
): Promise<UserPrivateKey> => {
  // find the encrypted CEK for the key
  const encryptedUserKey = encryptedUserKeys.find(
    k => bytesToBase64(k.kid) === bytesToBase64(kid)
  );

  if (!encryptedUserKey) throw new Error(`No encrypted UserKey found for key ${kid}`);

  return decryptKeyWrap(encryptedUserKey, key);
};

