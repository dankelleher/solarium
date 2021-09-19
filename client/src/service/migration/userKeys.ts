import { Keypair, PublicKey } from '@solana/web3.js';
import { SignCallback } from '../../lib/wallet';
import { didToPublicKey, ExtendedCluster } from '../../lib/util';
import { get as getUserDetails } from '../../api/userDetails/get';
import { create as createUserDetails } from '../../api/userDetails/create';
import { PROGRAM_ID } from '../../lib/constants';
import { getConnection } from '../../lib/solana/solanaUtil';
import { identity } from 'ramda';

export type MigrationDetails = {
  did: string;
  owner: Keypair | PublicKey;
  payer: Keypair | PublicKey;
  alias: string;
  channels: PublicKey[];
  userKeySize?: number;
  signCallback?: SignCallback;
  cluster?: ExtendedCluster;
};
export type MigrationResult = {
  skipped: boolean;
  error?: Error;
};

const OLD_CEK_ACCOUNT_NONCE_SEED_STRING = 'solarium_cek_account';
export async function getOldCekAccountAddress(
  ownerDID: PublicKey,
  channel: PublicKey
): Promise<PublicKey> {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [
      ownerDID.toBuffer(),
      channel.toBuffer(),
      Buffer.from(OLD_CEK_ACCOUNT_NONCE_SEED_STRING, 'utf8'),
    ],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
}

const hasOldCEKAccountForChannel = async (
  did: string,
  channel: PublicKey,
  cluster?: ExtendedCluster
): Promise<boolean> => {
  const didKey = didToPublicKey(did);
  const oldCEKAccountAddress = await getOldCekAccountAddress(didKey, channel);

  const account = await getConnection(cluster).getAccountInfo(
    oldCEKAccountAddress
  );
  return !!account && account.data.length > 0;
};

const requiresMigration = async (
  did: string,
  channels: PublicKey[],
  cluster?: ExtendedCluster
): Promise<boolean> => {
  // if there is already a userDetails account for the user, no migration needed
  const userDetails = await getUserDetails({
    did,
    cluster,
  });

  if (!userDetails) return false;

  // if the user has an "old-style" cek account for any of the known channels
  // they need to be migrated
  const hasOldCekAccountForChannelsPromises = channels.map(channel =>
    hasOldCEKAccountForChannel(did, channel, cluster)
  );

  // resolve the promises from above, and check if any of them are true
  return (await Promise.all(hasOldCekAccountForChannelsPromises)).some(
    identity
  );
};

async function migrateChannel(
  details: MigrationDetails,
  userDetails: void,
  channel: PublicKey
): Promise<MigrationResult> {
  // TODO
  console.log('Migrating', { details, userDetails, channel });
  return {
    skipped: false,
  };
}

export const migrate = async (
  details: MigrationDetails
): Promise<MigrationResult> => {
  const shouldMigrate = await requiresMigration(
    details.did,
    details.channels,
    details.cluster
  );
  if (!shouldMigrate)
    return {
      skipped: true,
    };

  const userDetails = await createUserDetails({
    ...details,
    size: details.userKeySize,
    ownerDID: details.did,
  });

  const migrationPromises = details.channels.map(channel =>
    migrateChannel(details, userDetails, channel)
  );

  await Promise.all(migrationPromises);

  return {
    skipped: false,
  };
};
