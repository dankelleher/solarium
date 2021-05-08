import {
  Account,
  Connection,
  Transaction,
  TransactionSignature,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { SOLANA_COMMITMENT } from '../constants';
import {getClusterEndpoint} from "../util";
import { memoizeWith, identity } from 'ramda';

const memoizedGetConnection = memoizeWith(identity, () => {
  console.log("Creating a new connection");
  return new Connection(getClusterEndpoint(), SOLANA_COMMITMENT);
})

export class SolanaUtil {
  static getConnection = memoizedGetConnection;
  
  static sendAndConfirmTransaction(
    connection: Connection,
    transaction: Transaction,
    ...signers: Array<Account>
  ): Promise<TransactionSignature> {
    return sendAndConfirmTransaction(connection, transaction, signers, {
      skipPreflight: false,
      commitment: SOLANA_COMMITMENT,
      preflightCommitment: SOLANA_COMMITMENT,
    });
  }

  static async newAccountWithLamports(
    connection: Connection,
    lamports: number = 1000000
  ): Promise<Account> {
    const account = new Account();

    let retries = 30;
    await connection.requestAirdrop(account.publicKey, lamports);
    for (;;) {
      await this.sleep(500);
      const balance = await connection.getBalance(account.publicKey);
      if (lamports <= balance) return account;
      if (--retries <= 0) break;
    }
    throw new Error(`Airdrop of ${lamports} failed`);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
