import { SolanaUtil } from './solanaUtil';
import {
  closeAccount,
  getKeyFromOwner,
  initialize,
  post,
} from './instruction';
import {Keypair, Connection, PublicKey, Transaction, TransactionInstruction} from '@solana/web3.js';
import {InboxData} from "./InboxData";
import {SignCallback} from "../wallet";
// import {DEFAULT_MAX_MESSAGE_COUNT, MESSAGE_SIZE_BYTES, PROGRAM_ID} from "../constants";

// const messageSizeOnChain = 1 + 32 + MESSAGE_SIZE_BYTES // Timestamp + sender + message size (TODO encode sender in message sig)
// const inboxHeader = 32 + 16 // owner + alias (TODO remove alias?)
// const inboxSize = inboxHeader + (messageSizeOnChain * DEFAULT_MAX_MESSAGE_COUNT)

export class SolariumTransaction {
  static async createInbox(
    connection: Connection,
    payer: Keypair,
    owner: PublicKey,
    signCallback?: SignCallback
  ): Promise<PublicKey> {
    const address = await getKeyFromOwner(owner);
    console.log(`Inbox address: ${address}`);

    const instruction = initialize(payer.publicKey, address, owner)

    await SolariumTransaction.signAndSendTransaction(
      connection,
      payer,
      [instruction],
      [],
      signCallback
    )
    
    return address;
  }

  static async getInboxData(
    connection: Connection,
    inboxAddress: PublicKey
  ): Promise<InboxData| null> {
    const accountInfo = await connection.getAccountInfo(inboxAddress);

    if (!accountInfo) return null;

    return InboxData.fromAccount(accountInfo.data);
  }

  /**
   * Create and send an instruction to close the inbox
   * @param connection A connection to the blockchain
   * @param inboxAddress The inbox to close
   * @param payer The payer of the transaction - by default, this account also receives the lamports stored
   * @param ownerDID The owner of the inbox
   * @param [owner] A signer of the owner DID (defaults to payer)
   * @param [receiver] The recipient of the lamports stored in the inbox (defaults to owner)
   * @param signCallback
   */
  static async closeInbox(
    connection: Connection,
    inboxAddress: PublicKey,
    payer: Keypair,
    ownerDID: PublicKey,
    owner: Keypair = payer,
    receiver: Keypair = payer,
    signCallback?: SignCallback
  ): Promise<string> {
    const instruction = closeAccount(inboxAddress, ownerDID, owner.publicKey, receiver.publicKey)

    return SolariumTransaction.signAndSendTransaction(
      connection,
      payer,
      [instruction],
      [owner],
      signCallback
    )
  }

  static async post(
    connection: Connection,
    payer: Keypair,
    senderDID: PublicKey,
    signer: Keypair,
    inboxAddress: PublicKey,
    message: string,
    signCallback?: SignCallback
  ): Promise<string> {
    const instruction = post(inboxAddress, senderDID, signer.publicKey, message);
    
    return SolariumTransaction.signAndSendTransaction(
      connection, 
      payer,
      [instruction],
      [signer],
      signCallback
    )
  }
  
  static async signAndSendTransaction(
    connection: Connection,
    payer: Keypair,
    instructions: TransactionInstruction[],
    signers: Keypair[],
    signCallback?: SignCallback
  ): Promise<string> {
    if (signCallback) {
      return signCallback(instructions,
      signers,  
        {
        // TODO recentBlockhash?
        feePayer: payer.publicKey
      })
    }

    const transaction = new Transaction().add(...instructions);

    // Send the instructions
    return SolanaUtil.sendAndConfirmTransaction(
      connection,
      transaction,
      payer,
      ...signers
    );
  }
}
