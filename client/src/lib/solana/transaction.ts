import { SolanaUtil } from './solanaUtil';
import {
  closeAccount,
  getKeyFromOwner,
  initialize,
  post,
} from './instruction';
import {Account, Connection, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import {InboxData} from "./InboxData";
import {DEFAULT_MAX_MESSAGE_COUNT, MESSAGE_SIZE_BYTES, PROGRAM_ID} from "../constants";

const messageSizeOnChain = 1 + 32 + MESSAGE_SIZE_BYTES // Timestamp + sender + message size (TODO encode sender in message sig)
const inboxHeader = 32 + 16 // owner + alias (TODO remove alias?)
const inboxSize = inboxHeader + (messageSizeOnChain * DEFAULT_MAX_MESSAGE_COUNT)

export class SolariumTransaction {
  static async createInbox(
    connection: Connection,
    payer: Account,
    owner: PublicKey,
  ): Promise<PublicKey> {
    const address = await getKeyFromOwner(owner);
    console.log(`Inbox address: ${address}`);
    
    const a = new Account()

    // Allocate memory for the account
    const accountBalanceNeeded = await connection.getMinimumBalanceForRentExemption(inboxSize);
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: a.publicKey,//address,
      lamports: accountBalanceNeeded,
      space: inboxSize,
      programId: PROGRAM_ID
    })
    const initializeInstruction = initialize(address, owner);
    const transaction = new Transaction().add(
      createAccountInstruction,
      // initializeInstruction
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
    payer: Account,
    ownerDID: PublicKey,
    owner: Account = payer,
    receiver: Account = payer,
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
    payer: Account,
    senderDID: PublicKey,
    signer: Account,
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
