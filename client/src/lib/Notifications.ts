import { PublicKey } from '@solana/web3.js';
import {
  NotificationData,
  NotificationsData,
} from './solana/models/NotificationsData';
import { ExtendedCluster } from './util';

export enum NotificationType {
  GROUP_CHANNEL,
  DIRECT_CHANNEL,
}

export class Notification {
  constructor(readonly type: NotificationType, readonly pubkey: PublicKey) {}

  static fromChainData(notificationData: NotificationData): Notification {
    const type = !!notificationData.notificationType.directChannel
      ? NotificationType.DIRECT_CHANNEL
      : NotificationType.GROUP_CHANNEL;

    return new Notification(type, notificationData.pubkey.toPublicKey());
  }
}

export class Notifications {
  constructor(
    readonly notifications: Notification[],
    private cluster?: ExtendedCluster
  ) {}

  static async exists(
    did: PublicKey,
    cluster?: ExtendedCluster
  ): Promise<boolean> {
    return NotificationsData.exists(did, cluster);
  }

  static async fromChainData(
    notificationsData: NotificationsData,
    cluster?: ExtendedCluster
  ): Promise<Notifications> {
    const notifications = notificationsData.notifications.map(n =>
      Notification.fromChainData(n)
    );

    return new Notifications(notifications, cluster);
  }
}
