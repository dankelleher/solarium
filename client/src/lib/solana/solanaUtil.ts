import {
  Keypair,
  Connection,
  Transaction,
  TransactionSignature,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js';
import { SOLANA_COMMITMENT } from '../constants';
import {getClusterEndpoint} from "../util";
import { memoizeWith, identity } from 'ramda';

const memoizedGetConnection = memoizeWith(identity, () => {
  return new Connection(getClusterEndpoint(), SOLANA_COMMITMENT);
})

export class SolanaUtil {
  static getConnection = memoizedGetConnection;
  
  static sendAndConfirmRawTransaction(
    connection: Connection,
    transaction: Transaction,
  ): Promise<TransactionSignature> {
    return sendAndConfirmRawTransaction(connection, transaction.serialize(), {
      skipPreflight: false,
      commitment: SOLANA_COMMITMENT,
      preflightCommitment: SOLANA_COMMITMENT,
    });
  }

  static async newWalletWithLamports(
    connection: Connection,
    lamports: number = 1000000
  ): Promise<Keypair> {
    const keypair = Keypair.generate();

    let retries = 30;
    await connection.requestAirdrop(keypair.publicKey, lamports);
    for (;;) {
      await this.sleep(500);
      const balance = await connection.getBalance(keypair.publicKey);
      if (lamports <= balance) return keypair;
      if (--retries <= 0) break;
    }
    throw new Error(`Airdrop of ${lamports} failed`);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
