import {UserPubKey} from "../solana/models/UserDetailsData";
import {DIDDocument} from "did-resolver";
import {EncryptedKey} from "../UserDetails";

type UserKeyPair = { userPubKey: UserPubKey, encryptedPrivateKeys: EncryptedKey[] }

// TODO @martin
const generateUserKey = () => {
  
};

/**
 * Generates a public and private keypair for a DID, and encrypts the private key
 * with every key in the DID.
 * @param didDocument
 */
export const makeUserKeyPair = async (didDocument: DIDDocument):Promise<UserKeyPair> => {
  // TODO @martin
  const [userPrivateKey, userPubKey] = await generateUserKey();
  
  const encryptedPrivateKeys = didDocument.verificationMethod?.map(key => {
    // TODO @martin
    return new EncryptedKey(undefined, undefined, undefined, undefined, undefined);
  })
  
  return {
    userPubKey,
    encryptedPrivateKeys: encryptedPrivateKeys || []
  }
} 