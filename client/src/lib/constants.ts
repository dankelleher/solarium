import { Commitment, PublicKey } from '@solana/web3.js';
import { ClusterType } from '@identity.com/sol-did-client';

// Should equal the contents of program/program-id.md
const PROD_PROGRAM_ID = 'boxndjnzQZEWbBku3YipL4pchYRc1zi4nNSrFUwawWo';
const DEV_PROGRAM_ID = 'dbo6b6DDmWTWpLcZM5SoVEf9X8DSJYPjVfD3Ptz6hod';

export const STAGE = (process.env.REACT_APP_STAGE || process.env.NODE_ENV);

export const PROGRAM_ID: PublicKey = STAGE === 'development' ? new PublicKey(DEV_PROGRAM_ID) : new PublicKey(PROD_PROGRAM_ID);
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
