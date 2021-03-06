import { useLocalStorageState } from "../storage";
import {
  Keypair,
  Connection,
  Transaction,
  TransactionInstruction, TransactionCtorFields,
} from "@solana/web3.js";
import React, { useContext, useEffect, useMemo } from "react";
import { notify } from "../notification";
import {ENDPOINTS} from "../constants";
import {ExtendedCluster, SignCallback, getConnection} from "solarium-js";
import Wallet from "@project-serum/sol-wallet-adapter";

// Default to Devnet
export const DEFAULT_ENDPOINT_INDEX = 2;

const DEFAULT_ENDPOINT = ENDPOINTS[DEFAULT_ENDPOINT_INDEX].endpoint;

interface ConnectionConfig {
  connection: Connection;
  endpoint: string;
  env: ExtendedCluster;
  setEndpoint: (val: string) => void;
}

const ConnectionContext = React.createContext<ConnectionConfig>({
  endpoint: DEFAULT_ENDPOINT,
  setEndpoint: () => {},
  connection: getConnection(ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name),
  env: ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name,
});

export function ConnectionProvider({ children = undefined as any }) {
  const [endpoint, setEndpoint] = useLocalStorageState<string>(
    "connectionEndpoints",
    ENDPOINTS[DEFAULT_ENDPOINT_INDEX].endpoint
  );

  const connection = useMemo(() => getConnection(ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name), []);

  const env =
    ENDPOINTS.find((end) => end.endpoint === endpoint)?.name ||
    ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name;

  // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from every getting empty
  // TODO is this still needed?
  useEffect(() => {
    const id = connection.onAccountChange(Keypair.generate().publicKey, () => {});
    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [connection]);

  useEffect(() => {
    const id = connection.onSlotChange(() => null);
    return () => {
      connection.removeSlotChangeListener(id);
    };
  }, [connection]);

  return (
    <ConnectionContext.Provider
      value={{
        endpoint,
        setEndpoint,
        connection,
        env,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext).connection as Connection;
}

export function useConnectionConfig() {
  const context = useContext(ConnectionContext);
  return {
    endpoint: context.endpoint,
    setEndpoint: context.setEndpoint,
    env: context.env,
  };
}

export const sign = (
  connection: Connection,
  wallet: Wallet,
  ...signers: Keypair[]
):SignCallback =>
  async (instructions: TransactionInstruction[], transactionOpts?: TransactionCtorFields, additionalSigners?: Keypair[]) => {
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
      ...transactionOpts
    })
      .add(...instructions);

    const allSigners = [...signers, ...(additionalSigners || [])]
    if (allSigners.length > 0) {
      transaction.partialSign(...allSigners);
    }
    return wallet.signTransaction(transaction);
  };

export const sendTransaction = async (
  connection: Connection,
  wallet: Wallet,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  awaitConfirmation = true
) => {
  const { blockhash: recentBlockhash } = await connection.getRecentBlockhash("max");
  const transaction = new Transaction(
    { recentBlockhash,
      feePayer: wallet.publicKey
    })
    .add(...instructions);

  // TODO remove
  // transaction.setSigners(
  //   // fee paid by the wallet owner
  //   wallet.publicKey,
  //   ...signers.map((s) => s.publicKey)
  // );

  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  const partiallySignedTransaction = await wallet.signTransaction(transaction);
  const rawTransaction = partiallySignedTransaction.serialize();

  const txid = await connection.sendRawTransaction(rawTransaction);

  if (awaitConfirmation) {
    const { value: status } = await connection.confirmTransaction(txid);

    if (status.err) {
      notify({
        message: "Transaction failed...",
        description: `${txid}`,
        type: "error",
      });

      throw new Error(
        `Raw transaction ${txid} failed (${JSON.stringify(status)})`
      );
    }
  }

  return txid;
};