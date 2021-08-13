import { SolanaUtil } from './solanaUtil';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { SignCallback } from '../wallet';
import { debug, ExtendedCluster, filterNil } from '../util';
import {
  addCEK,
  addToChannel,
  createUserDetails,
  updateUserDetails,
  getCekAccountKey,
  getDirectChannelAccountKey,
  getUserDetailsKey,
  initializeChannel,
  initializeDirectChannel,
  post,
  addNotification,
  getNotificationsKey,
  createNotifications,
} from './instruction';
import { CEKData } from './models/CEKData';
import { ChannelData } from './models/ChannelData';
import { NOTIFICATIONS_ENABLED, PROGRAM_ID } from '../constants';
import { CEKAccountData } from './models/CEKAccountData';
import { MessageData } from './models/MessageData';
import { UserDetailsData } from './models/UserDetailsData';
import {
  DirectChannel,
  GroupChannel,
  NotificationsData,
  NotificationType,
} from './models/NotificationsData';

const canAddNotification = async (
  inviteeDID: PublicKey,
  cluster?: ExtendedCluster
): Promise<boolean> =>
  NOTIFICATIONS_ENABLED &&
  (await NotificationsData.exists(inviteeDID, cluster));

export class SolariumTransaction {
  static async createGroupChannel(
    connection: Connection,
    payer: PublicKey,
    creatorDID: PublicKey,
    creatorAuthority: PublicKey,
    name: string,
    initialCEKs: CEKData[],
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const channel = Keypair.generate();
    debug(`Channel address: ${channel.publicKey.toBase58()}`);

    const size = ChannelData.sizeBytes();
    const balanceNeeded = await connection.getMinimumBalanceForRentExemption(
      size
    );
    const createChannelAccountInstruction = SystemProgram.createAccount({
      programId: PROGRAM_ID,
      fromPubkey: payer,
      lamports: balanceNeeded,
      newAccountPubkey: channel.publicKey,
      space: size,
    });

    const initializeChannelInstruction = await initializeChannel(
      payer,
      channel.publicKey,
      name,
      creatorDID,
      creatorAuthority,
      initialCEKs
    );

    await SolariumTransaction.signAndSendTransaction(
      [createChannelAccountInstruction, initializeChannelInstruction],
      signCallback,
      [channel],
      cluster
    );

    return channel.publicKey;
  }

  static async createDirectChannel(
    payer: PublicKey,
    creatorDID: PublicKey,
    creatorAuthority: PublicKey,
    inviteeDID: PublicKey,
    creatorCEKs: CEKData[],
    inviteeCEKs: CEKData[],
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const channel = await getDirectChannelAccountKey(creatorDID, inviteeDID);
    debug(`Channel address: ${channel.toBase58()}`);

    const initializeDirectChannelInstruction = await initializeDirectChannel(
      payer,
      channel,
      creatorDID,
      creatorAuthority,
      inviteeDID,
      creatorCEKs,
      inviteeCEKs
    );

    const notificationInstruction = (await canAddNotification(
      inviteeDID,
      cluster
    ))
      ? await this.addDirectChannelNotificationInstruction(
          creatorDID,
          creatorAuthority,
          inviteeDID
        )
      : null;

    await SolariumTransaction.signAndSendTransaction(
      filterNil([initializeDirectChannelInstruction, notificationInstruction]),
      signCallback,
      [],
      cluster
    );

    return channel;
  }

  private static addGroupChannelNotificationInstruction(
    inviterDID: PublicKey,
    inviterAuthority: PublicKey,
    inviteeDID: PublicKey,
    channel: PublicKey
  ): Promise<TransactionInstruction> {
    return addNotification(
      inviteeDID,
      inviterDID,
      inviterAuthority,
      new NotificationType({
        groupChannel: new GroupChannel({}),
      }),
      channel
    );
  }

  private static addDirectChannelNotificationInstruction(
    inviterDID: PublicKey,
    inviterAuthority: PublicKey,
    inviteeDID: PublicKey
  ): Promise<TransactionInstruction> {
    return addNotification(
      inviteeDID,
      inviterDID,
      inviterAuthority,
      new NotificationType({
        directChannel: new DirectChannel({}),
      }),
      inviterDID
    );
  }

  static async createNotificationsAccount(
    payer: PublicKey,
    did: PublicKey,
    signCallback: SignCallback,
    size?: number,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const notifications = await getNotificationsKey(did);
    debug(`Notifications address: ${notifications.toBase58()}`);

    const initializeNotificationsInstruction = await createNotifications(
      payer,
      did,
      size
    );

    await SolariumTransaction.signAndSendTransaction(
      [initializeNotificationsInstruction],
      signCallback,
      [],
      cluster
    );

    return notifications;
  }

  static async getNotifications(
    connection: Connection,
    did: PublicKey
  ): Promise<NotificationsData | null> {
    const notifications = await getNotificationsKey(did);
    const accountInfo = await connection.getAccountInfo(notifications);

    if (!accountInfo) return null;

    return NotificationsData.fromAccount(accountInfo.data);
  }

  static async addDIDToChannel(
    payer: PublicKey,
    channel: PublicKey,
    inviterDID: PublicKey,
    inviterAuthority: PublicKey,
    inviteeDID: PublicKey,
    ceks: CEKData[],
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<void> {
    const addToChannelInstruction = await addToChannel(
      payer,
      channel,
      inviteeDID,
      inviterDID,
      inviterAuthority,
      ceks
    );

    const notificationInstruction = NOTIFICATIONS_ENABLED
      ? await this.addGroupChannelNotificationInstruction(
          inviterDID,
          inviterAuthority,
          inviteeDID,
          channel
        )
      : null;

    await SolariumTransaction.signAndSendTransaction(
      filterNil([addToChannelInstruction, notificationInstruction]),
      signCallback,
      [],
      cluster
    );
  }

  static async getChannelData(
    connection: Connection,
    channel: PublicKey
  ): Promise<ChannelData | null> {
    const accountInfo = await connection.getAccountInfo(channel);

    if (!accountInfo) return null;

    return ChannelData.fromAccount(accountInfo.data);
  }

  static async getCEKAccountData(
    connection: Connection,
    ownerDID: PublicKey,
    channel: PublicKey
  ): Promise<CEKAccountData | null> {
    const cekAccount = await getCekAccountKey(ownerDID, channel);
    const accountInfo = await connection.getAccountInfo(cekAccount);

    if (!accountInfo) return null;

    return CEKAccountData.fromAccount(accountInfo.data);
  }

  static async postMessage(
    channel: PublicKey,
    senderDID: PublicKey,
    senderAuthority: PublicKey,
    message: string,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<string> {
    const messageData = MessageData.for(senderDID, message);
    const instruction = await post(channel, senderAuthority, messageData);

    return SolariumTransaction.signAndSendTransaction(
      [instruction],
      signCallback,
      [],
      cluster
    );
  }

  static async addCEKToAccount(
    channel: PublicKey,
    memberDID: PublicKey,
    memberAuthority: PublicKey,
    cek: CEKData,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<void> {
    const addToChannelInstruction = await addCEK(
      channel,
      memberDID,
      memberAuthority,
      cek
    );

    await SolariumTransaction.signAndSendTransaction(
      [addToChannelInstruction],
      signCallback,
      [],
      cluster
    );
  }

  static async createUserDetails(
    payer: PublicKey,
    did: PublicKey,
    authority: PublicKey,
    signCallback: SignCallback,
    alias: string,
    size?: number,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const userDetails = await getUserDetailsKey(did);
    debug(`userDetails address: ${userDetails.toBase58()}`);

    const createUserDetailsInstruction = await createUserDetails(
      payer,
      did,
      authority,
      alias,
      size
    );

    await SolariumTransaction.signAndSendTransaction(
      [createUserDetailsInstruction],
      signCallback,
      [],
      cluster
    );

    return userDetails;
  }

  static async updateUserDetails(
    did: PublicKey,
    authority: PublicKey,
    signCallback: SignCallback,
    alias: string,
    addressBook: string,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const userDetails = await getUserDetailsKey(did);
    debug(`userDetails address: ${userDetails.toBase58()}`);

    const updateUserDetailsInstruction = await updateUserDetails(
      did,
      authority,
      alias,
      addressBook
    );

    await SolariumTransaction.signAndSendTransaction(
      [updateUserDetailsInstruction],
      signCallback,
      [],
      cluster
    );

    return userDetails;
  }

  static async getUserDetails(
    connection: Connection,
    did: PublicKey
  ): Promise<UserDetailsData | null> {
    const userDetails = await getUserDetailsKey(did);
    const accountInfo = await connection.getAccountInfo(userDetails);

    if (!accountInfo) return null;

    return UserDetailsData.fromAccount(accountInfo.data);
  }

  static async signAndSendTransaction(
    instructions: TransactionInstruction[],
    createSignedTx: SignCallback,
    additionalSigners: Keypair[],
    cluster?: ExtendedCluster
  ): Promise<string> {
    const connection = SolanaUtil.getConnection(cluster);
    const {
      blockhash: recentBlockhash,
    } = await connection.getRecentBlockhash();

    const transaction = await createSignedTx(
      instructions,
      { recentBlockhash },
      additionalSigners
    );

    // Send the instructions
    return SolanaUtil.sendAndConfirmRawTransaction(connection, transaction);
  }
}
