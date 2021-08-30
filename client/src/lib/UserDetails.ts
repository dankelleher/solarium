import { UserDetailsData } from './solana/models/UserDetailsData';
import { ChainStorage } from './solana/solanaBorsh';
import {EncryptedKeyData} from "./solana/models/EncryptedKeyData";

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
  constructor(readonly alias: string, readonly addressBook: AddressBook) {}

  static async fromChainData(
    userDetailsData: UserDetailsData
  ): Promise<UserDetails> {
    const addressBook = new AddressBook(userDetailsData.addressBook);

    return new UserDetails(userDetailsData.alias, addressBook);
  }

  toChainData(): UserDetailsData {
    return new UserDetailsData({
      alias: this.alias,
      addressBook: this.addressBook.toChainData(),
    });
  }
}

// A type defining a key ID
export type Kid = Uint8Array;  // 8 bytes
// A type defining a key Initiation Vector
export type KeyIV = Uint8Array; // 24 bytes
// A type defining a key tag used by Poly1305 for message authentication
export type KeyTag = Uint8Array; // 16 bytes
// A type defining an ephemeral public key used for KDF Key Determination with Wrapped Private UserKey
export type EphemeralPubkey = Uint8Array; // 32 byte
// A type defining the wrapped encrypted key
export type KeyCiphertext = Uint8Array; // 32 bytes

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
      kid: this.kid,
      kiv: this.kiv,
      keyTag: this.keyTag,
      ephemeralPubkey: this.ephemeralPubkey,
      keyCiphertext: this.keyCiphertext
    });
  }
}