import { Commitment, PublicKey } from '@solana/web3.js';
import { ClusterType } from '@identity.com/sol-did-client';

// Should equal the contents of program/program-id.md
export const PROGRAM_ID: PublicKey = new PublicKey(
  'boxndjnzQZEWbBku3YipL4pchYRc1zi4nNSrFUwawWo'
);
export const SOLANA_COMMITMENT: Commitment = 'single'; // for message channels, the focus is speed rather than safety

// must match get_cek_account_address_with_seed in state.rs
export const CEK_ACCOUNT_NONCE_SEED_STRING = 'solarium_cek_account';

// must match get_channel_address_with_seed in state.rs
export const CHANNEL_NONCE_SEED_STRING = 'solarium_channel';

// The cluster reference for the sol-did client - used to generate
// DIDs that can be unambiguously resolved to any solana cluster
// e.g. did:sol:devnet:abcde
export const DEFAULT_CLUSTER = ClusterType.development(); // localhost - override with process.env.CLUSTER

export const MESSAGE_SIZE_BYTES = 512;
export const DEFAULT_MAX_MESSAGE_COUNT = 8;
