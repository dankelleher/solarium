import {Assignable, SCHEMA} from "../solanaBorsh";

export class CEKData extends Assignable {
  header: string  // TODO
  kid: string;
  encryptedKey: string; // TODO Bytes?
}

SCHEMA.set(CEKData, {
  kind: 'struct',
  fields: [
    ['header', 'string'],
    ['kid', 'string'],
    ['encryptedKey', 'string'],
  ],
});