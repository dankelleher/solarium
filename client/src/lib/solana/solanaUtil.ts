import {
  Keypair,
  Connection,
  Transaction,
  TransactionSignature,
  sendAndConfirmRawTransaction,
  PublicKey,
} from '@solana/web3.js';
import { SOLANA_COMMITMENT } from '../constants';
import { ExtendedCluster, getClusterEndpoint } from '../util';
import { memoizeWith } from 'ramda';

const memoizedGetConnection = memoizeWith(
  getClusterEndpoint,
  (cluster?: ExtendedCluster) =>
    new Connection(getClusterEndpoint(cluster), SOLANA_COMMITMENT)
);

export class SolanaUtil {
  static getConnection = memoizedGetConnection;

  static sendAndConfirmRawTransaction(
    connection: Connection,
    transaction: Transaction
  ): Promise<TransactionSignature> {
    return sendAndConfirmRawTransaction(connection, transaction.serialize(), {
      skipPreflight: false,
      commitment: SOLANA_COMMITMENT,
      preflightCommitment: SOLANA_COMMITMENT,
    });
  }

  static async newWalletWithLamports(
    connection: Connection,
    lamports = 1000000
  ): Promise<Keypair> {
    const keypair = Keypair.generate();
    await this.airdrop(connection, keypair.publicKey, lamports);

    return keypair;
  }

  static async airdrop(
    connection: Connection,
    publicKey: PublicKey,
    lamports = 1000000
  ): Promise<void> {
    let retries = 30;
    await connection.requestAirdrop(publicKey, lamports);
    for (;;) {
      await this.sleep(500);
      const balance = await connection.getBalance(publicKey);
      if (lamports <= balance) return;
      if (--retries <= 0) break;
    }
    throw new Error(`Airdrop of ${lamports} failed`);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const airdrop = (
  connection: Connection,
  publicKey: PublicKey,
  lamports = 1000000
): Promise<void> => SolanaUtil.airdrop(connection, publicKey, lamports);

export const getConnection = (cluster?: ExtendedCluster): Connection =>
  SolanaUtil.getConnection(cluster);
