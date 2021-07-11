import {Assignable, SCHEMA} from "../solanaBorsh";
import {MessageData} from "./MessageData";
import {DEFAULT_MAX_MESSAGE_COUNT, MESSAGE_SIZE_BYTES} from "../../constants";

export class UserDetailsData extends Assignable {
  alias: string;
  addressBook: string;

  static fromAccount(accountData: Buffer): UserDetailsData {
    return UserDetailsData.decode<UserDetailsData>(accountData);
  }

  static empty(alias: String): UserDetailsData {
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