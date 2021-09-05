import { UserDetailsData } from './solana/models/UserDetailsData';
import { ChainStorage } from './solana/solanaBorsh';
import { EncryptedKeyData } from './solana/models/EncryptedKeyData';

// A type defining the public component of a user public key
export type UserPubKey = Uint8Array; // 32 bytes
export const USER_PUB_KEY_SIZE = 32;

// A type defining a key ID
export type Kid = Uint8Array; // 8 bytes
export const KID_SIZE = 8;

// A type defining a key Initiation Vector
export type KeyIV = Uint8Array; // 24 bytes
// A type defining a key tag used by Poly1305 for message authentication
export type KeyTag = Uint8Array; // 16 bytes
// A type defining an ephemeral public key used for KDF Key Determination with Wrapped Private UserKey
export type EphemeralPubkey = Uint8Array; // 32 bytes
// A type defining the wrapped encrypted key
export type KeyCiphertext = Uint8Array; // 32 bytes
// TODO @martin there is lots of overlap between these types
// and the PrivateKey and PublicKeyBase58 types in client/src/lib/util.ts
// I suggest the EncryptedKey object uses the ones in client/src/lib/util.ts
// where appropriate

export class EncryptedKey implements ChainStorage<EncryptedKeyData> {
  constructor(
    readonly kid: Kid,
    readonly kiv: KeyIV,
    readonly keyTag: KeyTag,
    readonly ephemeralPubkey: EphemeralPubkey,
    readonly keyCiphertext: KeyCiphertext
  ) {}

  toChainData(): EncryptedKeyData {
    return new EncryptedKeyData({
      kid: Array.from(this.kid),
      kiv: Array.from(this.kiv),
      keyTag: Array.from(this.keyTag),
      ephemeralPubkey: Array.from(this.ephemeralPubkey),
      keyCiphertext: Array.from(this.keyCiphertext),
    });
  }

  static fromChainData(encryptedKeyData: EncryptedKeyData): EncryptedKey {
    return new EncryptedKey(
      Uint8Array.from(encryptedKeyData.kid),
      Uint8Array.from(encryptedKeyData.kiv),
      Uint8Array.from(encryptedKeyData.keyTag),
      Uint8Array.from(encryptedKeyData.ephemeralPubkey),
      Uint8Array.from(encryptedKeyData.keyCiphertext)
    );
  }
}

// TODO
export class AddressBook implements ChainStorage<string> {
  constructor(readonly data: string) {
    // TODO temporary
  }

  // TODO decrypt address book
  static async fromChainData(encrypted: string): Promise<AddressBook> {
    return new AddressBook(encrypted);
  }

  toChainData(): string {
    return this.data;
  }
}

export class UserDetails implements ChainStorage<UserDetailsData> {
  constructor(
    readonly alias: string,
    readonly addressBook: AddressBook,
    readonly userPubKey: UserPubKey,
    readonly encryptedUserPrivateKeyData: EncryptedKey[]
  ) {}

  static async fromChainData(
    userDetailsData: UserDetailsData
  ): Promise<UserDetails> {
    const addressBook = new AddressBook(userDetailsData.addressBook);
    const encryptedUserPrivateKeyData = userDetailsData.encryptedUserPrivateKeyData.map(
      encryptedKeyData => EncryptedKey.fromChainData(encryptedKeyData)
    );
    const userPubKey = Uint8Array.from(userDetailsData.userPubKey);

    return new UserDetails(
      userDetailsData.alias,
      addressBook,
      userPubKey,
      encryptedUserPrivateKeyData
    );
  }

  toChainData(): UserDetailsData {
    return new UserDetailsData({
      alias: this.alias,
      addressBook: this.addressBook.toChainData(),
    });
  }
}
