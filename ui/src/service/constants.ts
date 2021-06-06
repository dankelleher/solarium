import {clusterApiUrl, Commitment, PublicKey} from "@solana/web3.js";
import {ExtendedCluster} from "solarium-js";

export const SOLARIUM_PROGRAM_ID = new PublicKey(
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

// The minimum wallet balance. If a wallet goes below this, actions trigger an airdrop (on non-mainnet)
export const MIN_BALANCE = 500000000

export const DEFAULT_CHANNEL = 'lobby';
export const URL_PARAM_JOIN_ADDRESS = 'joinAddress'
export const URL_PARAM_JOIN_NAME = 'joinName'

