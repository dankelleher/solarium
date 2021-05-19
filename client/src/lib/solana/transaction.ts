import { SolanaUtil } from './solanaUtil';
import { closeAccount, getKeyFromOwner, initialize, post } from './instruction';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { InboxData } from './InboxData';
import { SignCallback } from '../wallet';
import { ExtendedCluster } from '../util';
// import {DEFAULT_MAX_MESSAGE_COUNT, MESSAGE_SIZE_BYTES, PROGRAM_ID} from "../constants";

// const messageSizeOnChain = 1 + 32 + MESSAGE_SIZE_BYTES // Timestamp + sender + message size (TODO encode sender in message sig)
// const inboxHeader = 32 + 16 // owner + alias (TODO remove alias?)
// const inboxSize = inboxHeader + (messageSizeOnChain * DEFAULT_MAX_MESSAGE_COUNT)

export class SolariumTransaction {
  static async createInbox(
    payer: PublicKey,
    owner: PublicKey,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<PublicKey> {
    const address = await getKeyFromOwner(owner);
    console.log(`Inbox address: ${address}`);

    const instruction = initialize(payer, address, owner);

    await SolariumTransaction.signAndSendTransaction(
      [instruction],
      signCallback,
      cluster
    );

    return address;
  }

  static async getInboxData(
    connection: Connection,
    inboxAddress: PublicKey
  ): Promise<InboxData | null> {
    const accountInfo = await connection.getAccountInfo(inboxAddress);

    if (!accountInfo) return null;

    return InboxData.fromAccount(accountInfo.data);
  }

  /**
   * Create and send an instruction to close the inbox
   * @param inboxAddress The inbox to close
   * @param ownerDID The owner of the inbox
   * @param [owner] A signer of the owner DID (defaults to payer)
   * @param [receiver] The recipient of the lamports stored in the inbox (defaults to owner)
   * @param signCallback
   * @param cluster
   */
  static async closeInbox(
    inboxAddress: PublicKey,
    ownerDID: PublicKey,
    owner: PublicKey,
    receiver: PublicKey,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<string> {
    const instruction = closeAccount(inboxAddress, ownerDID, owner, receiver);

    return SolariumTransaction.signAndSendTransaction(
      [instruction],
      signCallback,
      cluster
    );
  }

  static async post(
    senderDID: PublicKey,
    signer: PublicKey,
    inboxAddress: PublicKey,
    message: string,
    signCallback: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<string> {
    const instruction = post(inboxAddress, senderDID, signer, message);

    return SolariumTransaction.signAndSendTransaction(
      [instruction],
      signCallback,
      cluster
    );
  }

  static async signAndSendTransaction(
    instructions: TransactionInstruction[],
    createSignedTx: SignCallback,
    cluster?: ExtendedCluster
  ): Promise<string> {
    const connection = SolanaUtil.getConnection(cluster);
    const {
      blockhash: recentBlockhash,
    } = await connection.getRecentBlockhash();

    const transaction = await createSignedTx(instructions, { recentBlockhash });

    // Send the instructions
    return SolanaUtil.sendAndConfirmRawTransaction(connection, transaction);
  }
}
