import { Assignable, SCHEMA } from '../solanaBorsh';
import {EncryptedKeyData} from "./EncryptedKeyData";

// A type defining the public component of a user public key
export type UserPubKey = Uint8Array; // 32 bytes

export class UserDetailsData extends Assignable {
  alias: string;
  addressBook: string;
  // The user private key, encrypted for each key in their DID
  encryptedUserPrivateKeyData: EncryptedKeyData[];
  // The user public key
  userPubKey: UserPubKey;

  static fromAccount(accountData: Buffer): UserDetailsData {
    return UserDetailsData.decode<UserDetailsData>(accountData);
  }

  static empty(alias: string): UserDetailsData {
    return new UserDetailsData({
      alias,
      addressBook: '',
    });
  }
}

SCHEMA.set(UserDetailsData, {
  kind: 'struct',
  fields: [
    ['alias', 'string'],
    ['addressBook', 'string'],
    ['encryptedUserPrivateKeyData', [EncryptedKeyData]],
    ['userPubKey', [32]],
  ],
});
