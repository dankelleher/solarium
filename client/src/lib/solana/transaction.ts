import { SolanaUtil } from './solanaUtil';
import {
  closeAccount,
  getKeyFromOwner,
  initialize,
  post,
} from './instruction';
import {Keypair, Connection, PublicKey, Transaction} from '@solana/web3.js';
import {InboxData} from "./InboxData";
// import {DEFAULT_MAX_MESSAGE_COUNT, MESSAGE_SIZE_BYTES, PROGRAM_ID} from "../constants";

// const messageSizeOnChain = 1 + 32 + MESSAGE_SIZE_BYTES // Timestamp + sender + message size (TODO encode sender in message sig)
// const inboxHeader = 32 + 16 // owner + alias (TODO remove alias?)
// const inboxSize = inboxHeader + (messageSizeOnChain * DEFAULT_MAX_MESSAGE_COUNT)

export class SolariumTransaction {
  static async createInbox(
    connection: Connection,
    payer: Keypair,
    owner: PublicKey,
  ): Promise<PublicKey> {
    const address = await getKeyFromOwner(owner);
    console.log(`Inbox address: ${address}`);

    // Allocate memory for the account
    const transaction = new Transaction().add(
      initialize(payer.publicKey, address, owner)
    );

    // Send the instructions
    await SolanaUtil.sendAndConfirmTransaction(connection, transaction, payer);
    return address;
  }

  static async getInboxData(
    connection: Connection,
    inboxAddress: PublicKey
  ): Promise<InboxData| null> {
    const data = await connection.getAccountInfo(inboxAddress);

    if (!data) return null;

    return InboxData.fromAccount(data.data);
  }

  /**
   * Create and send an instruction to close the inbox
   * @param connection A connection to the blockchain
   * @param inboxAddress The inbox to close
   * @param payer The payer of the transaction - by default, this account also receives the lamports stored
   * @param ownerDID The owner of the inbox
   * @param [owner] A signer of the owner DID (defaults to payer)
   * @param [receiver] The recipient of the lamports stored in the inbox (defaults to owner)
   */
  static async closeInbox(
    connection: Connection,
    inboxAddress: PublicKey,
    payer: Keypair,
    ownerDID: PublicKey,
    owner: Keypair = payer,
    receiver: Keypair = payer,
  ): Promise<string> {
    // Create the transaction to close the inbox
    const transaction = new Transaction().add(
      closeAccount(inboxAddress, ownerDID, owner.publicKey, receiver.publicKey)
    );

    // Send the instructions
    return SolanaUtil.sendAndConfirmTransaction(
      connection,
      transaction,
      payer,
      owner
    );
  }

  static async post(
    connection: Connection,
    payer: Keypair,
    senderDID: PublicKey,
    signer: Keypair,
    inboxAddress: PublicKey,
    message: string,
  ): Promise<string> {
    const transaction = new Transaction().add(
      post(inboxAddress, senderDID, signer.publicKey, message)
    );

    // Send the instructions
    return SolanaUtil.sendAndConfirmTransaction(
      connection,
      transaction,
      payer,
      signer
    );
  }
}
