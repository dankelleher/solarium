import { SolanaUtil } from './solanaUtil';
import {Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction} from '@solana/web3.js';
import { SignCallback } from '../wallet';
import {debug, ExtendedCluster} from '../util';
import {
  addCEK,
  addToChannel,
  getCekAccountKey,
  getDirectChannelAccountKey,
  initializeChannel,
  initializeDirectChannel,
  post
} from "./instruction";
import {CEKData} from "./models/CEKData";
import {ChannelData} from "./models/ChannelData";
import {PROGRAM_ID} from "../constants";
import {CEKAccountData} from "./models/CEKAccountData";
import {MessageData} from "./models/MessageData";

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
    const balanceNeeded = await connection.getMinimumBalanceForRentExemption(size)
    const createChannelAccountInstruction = SystemProgram.createAccount({
      programId: PROGRAM_ID,
      fromPubkey: payer,
      lamports: balanceNeeded,
      newAccountPubkey: channel.publicKey,
      space: size
    })
    
    const initializeChannelInstruction = await initializeChannel(
      payer,
      channel.publicKey,
      name,
      creatorDID,
      creatorAuthority,
      initialCEKs);

    await SolariumTransaction.signAndSendTransaction(
      [
        createChannelAccountInstruction,
        initializeChannelInstruction
      ],
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
      inviteeCEKs);


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
      ceks);

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
      cek);

    await SolariumTransaction.signAndSendTransaction(
      [addToChannelInstruction],
      signCallback,
      [],
      cluster
    );
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

    const transaction = await createSignedTx(instructions, { recentBlockhash }, additionalSigners);

    // Send the instructions
    return SolanaUtil.sendAndConfirmRawTransaction(connection, transaction);
  }
}
