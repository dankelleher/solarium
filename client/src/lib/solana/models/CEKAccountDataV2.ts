import { Assignable, AssignablePublicKey, SCHEMA } from '../solanaBorsh';
import { EncryptedKeyData } from './EncryptedKeyData';

export class CEKAccountDataV2 extends Assignable {
  ownerDID: AssignablePublicKey;
  channel: AssignablePublicKey;
  cek: EncryptedKeyData;

  static fromAccount(accountData: Buffer): CEKAccountDataV2 {
    return CEKAccountDataV2.decode<CEKAccountDataV2>(accountData);
  }

  static empty(
    ownerDID: AssignablePublicKey,
    channel: AssignablePublicKey
  ): CEKAccountDataV2 {
    return new CEKAccountDataV2({
      ownerDID,
      channel,
      ceks: [],
    });
  }
}

SCHEMA.set(CEKAccountDataV2, {
  kind: 'struct',
  fields: [
    ['ownerDID', AssignablePublicKey],
    ['channel', AssignablePublicKey],
    ['cek', EncryptedKeyData],
  ],
});
