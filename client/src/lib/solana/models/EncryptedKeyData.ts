import { Assignable, SCHEMA } from '../solanaBorsh';

export class EncryptedKeyData extends Assignable {
  kid: Array<number>;
  kiv: Array<number>;
  keyTag: Array<number>;
  ephemeralPubkey: Array<number>;
  keyCiphertext: Array<number>;
}

SCHEMA.set(EncryptedKeyData, {
  kind: 'struct',
  fields: [
    ['kid', [8]],
    ['kiv', [24]],
    ['keyTag', [16]],
    ['ephemeralPubkey', [32]],
    ['keyCiphertext', [32]],
  ],
});
