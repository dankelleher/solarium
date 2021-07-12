import { UserDetailsData } from './solana/models/UserDetailsData';

// TODO
export class AddressBook {}

export class UserDetails {
  constructor(readonly alias: string, readonly addressBook: AddressBook) {}

  static async fromChainData(
    userDetailsData: UserDetailsData
  ): Promise<UserDetails> {
    // TODO decrypt address book
    const addressBook = new AddressBook();

    return new UserDetails(userDetailsData.alias, addressBook);
  }
}
