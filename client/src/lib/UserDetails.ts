import { UserDetailsData } from './solana/models/UserDetailsData';
import { ChainStorage } from './solana/solanaBorsh';

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
