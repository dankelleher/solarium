import { Assignable, AssignablePublicKey, Enum, SCHEMA } from '../solanaBorsh';
import { PublicKey } from '@solana/web3.js';
import { ExtendedCluster } from '../../util';
import { getNotificationsKey } from '../instruction';
import { SolanaUtil } from '../solanaUtil';

export class GroupChannel extends Assignable {}
export class DirectChannel extends Assignable {}

export class NotificationType extends Enum {
  groupChannel: GroupChannel;
  directChannel: DirectChannel;
}

export class NotificationData extends Assignable {
  notificationType: NotificationType;
  pubkey: AssignablePublicKey;
}

export class NotificationsData extends Assignable {
  name: string;
  notifications: NotificationData[];

  static fromAccount(accountData: Buffer): NotificationsData {
    return NotificationsData.decode<NotificationsData>(accountData);
  }

  static empty(): NotificationsData {
    return new NotificationsData({});
  }

  static async exists(
    did: PublicKey,
    cluster?: ExtendedCluster
  ): Promise<boolean> {
    const notificationsAccount = await getNotificationsKey(did);

    const connection = SolanaUtil.getConnection(cluster);

    const notificationsAccountInfo = await connection.getAccountInfo(
      notificationsAccount
    );

    return !!notificationsAccountInfo;
  }
}

SCHEMA.set(NotificationType, {
  kind: 'enum',
  field: 'enum',
  values: [
    ['groupChannel', GroupChannel],
    ['directChannel', DirectChannel],
  ],
});
SCHEMA.set(NotificationData, {
  kind: 'struct',
  fields: [
    ['notificationType', NotificationType],
    ['pubkey', AssignablePublicKey],
  ],
});
SCHEMA.set(NotificationData, {
  kind: 'struct',
  fields: [
    ['size', 'u8'],
    ['notifications', [NotificationData]],
  ],
});
SCHEMA.set(GroupChannel, { kind: "struct", fields: [] });
SCHEMA.set(DirectChannel, { kind: "struct", fields: [] });