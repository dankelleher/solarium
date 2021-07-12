import { Assignable, AssignablePublicKey, SCHEMA } from '../solanaBorsh';
import { CEKData } from './CEKData';

export class CEKAccountData extends Assignable {
  ownerDID: AssignablePublicKey;
  channel: AssignablePublicKey;
  ceks: CEKData[];

  static fromAccount(accountData: Buffer): CEKAccountData {
    return CEKAccountData.decode<CEKAccountData>(accountData);
  }

  static empty(
    ownerDID: AssignablePublicKey,
    channel: AssignablePublicKey
  ): CEKAccountData {
    return new CEKAccountData({
      ownerDID,
      channel,
      ceks: [],
    });
  }
}

SCHEMA.set(CEKAccountData, {
  kind: 'struct',
  fields: [
    ['ownerDID', AssignablePublicKey],
    ['channel', AssignablePublicKey],
    ['ceks', [CEKData]],
  ],
});
