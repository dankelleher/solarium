import { Assignable, SCHEMA } from '../solanaBorsh';
import {
  EphemeralPubkey,
  KeyCiphertext,
  KeyIV,
  KeyTag,
  Kid,
} from '../../UserDetails';

export class EncryptedKeyData extends Assignable {
  kid: Kid;
  kiv: KeyIV;
  keyTag: KeyTag;
  ephemeralPubkey: EphemeralPubkey;
  keyCiphertext: KeyCiphertext;
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
