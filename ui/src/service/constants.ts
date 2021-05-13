import {clusterApiUrl, Commitment, PublicKey} from "@solana/web3.js";
import {ExtendedCluster} from "solarium-js";

export const INBOX_PROGRAM_ID = new PublicKey(
  "boxndjnzQZEWbBku3YipL4pchYRc1zi4nNSrFUwawWo"
);

export const DEFAULT_COMMITMENT: Commitment = "processed";

export const ENDPOINTS = [
  {
    name: "mainnet-beta" as ExtendedCluster,
    endpoint: clusterApiUrl("mainnet-beta"),
  },
  { name: "testnet" as ExtendedCluster, endpoint: clusterApiUrl("testnet") },
  { name: "devnet" as ExtendedCluster, endpoint: clusterApiUrl("devnet") },
  { name: "localnet" as ExtendedCluster, endpoint: "http://127.0.0.1:8899" },
];