import { SolanaUtil } from './solanaUtil';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { SignCallback } from '../wallet';
import { debug, ExtendedCluster } from '../util';
import {
  addEncryptedUserKey,
  addToChannel,
  createUserDetails,
  updateUserDetails,
  getCekAccountAddress,
  getDirectChannelAccountAddress,
  getUserDetailsAddress,
  initializeChannel,
  initializeDirectChannel,
  post,
} from './instruction';
import { EncryptedKeyData } from './models/EncryptedKeyData';
import { ChannelData } from './models/ChannelData';
import { PROGRAM_ID } from '../constants';
import { CEKAccountDataV2 } from './models/CEKAccountDataV2';
import { MessageData } from './models/MessageData';
import { UserDetailsData } from './models/UserDetailsData';

export class SolariumTransaction {
  static async createGroupChannel(
    connection: Connection,
    payer: PublicKey,
    creatorDID: PublicKey,
    creatorAuthority: PublicKey,
    name: string,
    initialCEK: EncryptedKeyData,
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
      initialCEK
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
    creatorCEK: EncryptedKeyData,
    inviteeCEK: EncryptedKeyData,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const channel = await getDirectChannelAccountAddress(
      creatorDID,
      inviteeDID
    );
    debug(`Channel address: ${channel.toBase58()}`);

    const initializeDirectChannelInstruction = await initializeDirectChannel(
      payer,
      channel,
      creatorDID,
      creatorAuthority,
      inviteeDID,
      creatorCEK,
      inviteeCEK
    );

    await SolariumTransaction.signAndSendTransaction(
      [initializeDirectChannelInstruction],
      signCallback,
      [],
      cluster
    );

    return channel;
  }

  static async addDIDToChannel(
    payer: PublicKey,
    channel: PublicKey,
    inviterDID: PublicKey,
    inviterAuthority: PublicKey,
    inviteeDID: PublicKey,
    cek: EncryptedKeyData,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<void> {
    const addToChannelInstruction = await addToChannel(
      payer,
      channel,
      inviteeDID,
      inviterDID,
      inviterAuthority,
      cek
    );

    await SolariumTransaction.signAndSendTransaction(
      [addToChannelInstruction],
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
  ): Promise<CEKAccountDataV2 | null> {
    const cekAccount = await getCekAccountAddress(ownerDID, channel);
    const accountInfo = await connection.getAccountInfo(cekAccount);

    if (!accountInfo) return null;

    return CEKAccountDataV2.fromAccount(accountInfo.data);
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

  static async addKeyToUser(
    memberDID: PublicKey,
    memberAuthority: PublicKey,
    keyData: EncryptedKeyData,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<void> {
    const addEncryptedUserKeyInstruction = await addEncryptedUserKey(
      memberDID,
      memberAuthority,
      keyData
    );

    await SolariumTransaction.signAndSendTransaction(
      [addEncryptedUserKeyInstruction],
      signCallback,
      [],
      cluster
    );
  }

  static async createUserDetails(
    payer: PublicKey,
    did: PublicKey,
    authority: PublicKey,
    encryptedUserPrivateKeyData: EncryptedKeyData[],
    userPubKey: Array<number>,
    signCallback: SignCallback,
    alias: string,
    size?: number,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const userDetails = await getUserDetailsAddress(did);
    debug(`userDetails address: ${userDetails.toBase58()}`);

    const createUserDetailsInstruction = await createUserDetails(
      payer,
      did,
      authority,
      alias,
      encryptedUserPrivateKeyData,
      userPubKey,
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
    const userDetails = await getUserDetailsAddress(did);
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
    const userDetails = await getUserDetailsAddress(did);
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
