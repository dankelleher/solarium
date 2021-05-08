import { Commitment, PublicKey } from '@solana/web3.js';
import {ClusterType} from "@identity.com/sol-did-client";

// Should equal the contents of program/program-id.md
export const PROGRAM_ID: PublicKey = new PublicKey(
  'boxndjnzQZEWbBku3YipL4pchYRc1zi4nNSrFUwawWo'
);
export const SOLANA_COMMITMENT: Commitment = 'single';  // for an inbox, the focus is speed rather than safety
export const NONCE_SEED_STRING = 'solarium';  // must match get_inbox_address_with_seed in state.rs

// The cluster reference for the sol-did client - used to generate
// DIDs that can be unambiguously resolved to any solana cluster
// e.g. did:sol:devnet:abcde
export const DEFAULT_CLUSTER = ClusterType.development(); // TODO

// must match
export const MESSAGE_SIZE_BYTES = 1024;
export const DEFAULT_MAX_MESSAGE_COUNT = 10;