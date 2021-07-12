import { Assignable, SCHEMA } from '../solanaBorsh';

export class UserDetailsData extends Assignable {
  alias: string;
  addressBook: string;

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
  ],
});
