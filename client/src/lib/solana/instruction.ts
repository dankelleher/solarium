import { Enum, Assignable, SCHEMA } from './solanaBorsh';
import {
  CEK_ACCOUNT_V2_NONCE_SEED_STRING,
  CHANNEL_NONCE_SEED_STRING,
  DEFAULT_USER_DETAILS_SIZE,
  PROGRAM_ID,
  USER_DETAILS_ACCOUNT_NONCE_SEED_STRING,
} from '../constants';
import {
  AccountMeta,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { EncryptedKeyData } from './models/EncryptedKeyData';
import { MessageData } from './models/MessageData';
import { UserPubKey } from './models/UserDetailsData';
import { Kid } from '../UserDetails';

export class InitializeChannel extends Assignable {
  name: string;
  cek: EncryptedKeyData;
}

export class InitializeDirectChannel extends Assignable {
  creatorCEK: EncryptedKeyData;
  inviteeCEK: EncryptedKeyData;
}

export class Post extends Assignable {
  message: string;
}

export class AddToChannel extends Assignable {
  cek: EncryptedKeyData;
}

export class AddEncryptedUserKey extends Assignable {
  keyData: EncryptedKeyData;
}

export class RemoveEncryptedUserKey extends Assignable {
  kid: Kid;
}

export class CreateUserDetails extends Assignable {
  alias: string;
  addressBook: string;
  size: number;
  encryptedUserPrivateKeyData: EncryptedKeyData[];
  userPubKey: UserPubKey;
}

export class UpdateUserDetails extends Assignable {
  alias: string;
  addressBook: string;
}

export class SolariumInstruction extends Enum {
  initializeChannel: InitializeChannel;
  initializeDirectChannel: InitializeDirectChannel;
  post: Post;
  addToChannel: AddToChannel;
  addEncryptedUserKey: AddEncryptedUserKey;
  removeEncryptedUserKey: RemoveEncryptedUserKey;
  createUserDetails: CreateUserDetails;
  updateUserDetails: UpdateUserDetails;

  static initializeChannel(
    name: string,
    cek: EncryptedKeyData
  ): SolariumInstruction {
    return new SolariumInstruction({
      initializeChannel: new InitializeChannel({ name, cek }),
    });
  }

  static initializeDirectChannel(
    creatorCEK: EncryptedKeyData,
    inviteeCEK: EncryptedKeyData
  ): SolariumInstruction {
    return new SolariumInstruction({
      initializeDirectChannel: new InitializeDirectChannel({
        creatorCEK,
        inviteeCEK,
      }),
    });
  }

  static post(message: string): SolariumInstruction {
    return new SolariumInstruction({ post: new Post({ message }) });
  }

  static addToChannel(cek: EncryptedKeyData): SolariumInstruction {
    return new SolariumInstruction({
      addToChannel: new AddToChannel({ cek }),
    });
  }

  static addEncryptedUserKey(keyData: EncryptedKeyData): SolariumInstruction {
    return new SolariumInstruction({
      addEncryptedUerKey: new AddEncryptedUserKey({ keyData }),
    });
  }

  static removeEncryptedUserKey(kid: Kid): SolariumInstruction {
    return new SolariumInstruction({
      removeEncryptedUserKey: new RemoveEncryptedUserKey({ kid }),
    });
  }

  static createUserDetails(
    alias: string,
    encryptedUserPrivateKeyData: EncryptedKeyData[],
    userPubKey: UserPubKey,
    addressBook = '',
    size: number = DEFAULT_USER_DETAILS_SIZE
  ): SolariumInstruction {
    return new SolariumInstruction({
      createUserDetails: new CreateUserDetails({
        alias,
        addressBook,
        size,
        encryptedUserPrivateKeyData,
        userPubKey,
      }),
    });
  }

  static updateUserDetails(
    alias: string,
    addressBook = ''
  ): SolariumInstruction {
    return new SolariumInstruction({
      updateUserDetails: new UpdateUserDetails({ alias, addressBook }),
    });
  }
}

export async function getCekAccountAddress(
  ownerDID: PublicKey,
  channel: PublicKey
): Promise<PublicKey> {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [
      ownerDID.toBuffer(),
      channel.toBuffer(),
      Buffer.from(CEK_ACCOUNT_V2_NONCE_SEED_STRING, 'utf8'),
    ],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
}

export async function getUserDetailsAddress(
  did: PublicKey
): Promise<PublicKey> {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [
      did.toBuffer(),
      Buffer.from(USER_DETAILS_ACCOUNT_NONCE_SEED_STRING, 'utf8'),
    ],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
}

export async function getDirectChannelAccountAddress(
  did1: PublicKey,
  did2: PublicKey
): Promise<PublicKey> {
  // To ensure predictable account addresses, sort the DIDs alphabetically.
  const reverse = did1.toBuffer().compare(did2.toBuffer()) === 1;
  const orderedDIDs = reverse
    ? [did2.toBuffer(), did1.toBuffer()]
    : [did1.toBuffer(), did2.toBuffer()];
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [...orderedDIDs, Buffer.from(CHANNEL_NONCE_SEED_STRING, 'utf8')],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
}

export async function initializeChannel(
  payer: PublicKey,
  channel: PublicKey,
  name: string,
  creatorDID: PublicKey,
  creatorAuthority: PublicKey,
  cek: EncryptedKeyData
): Promise<TransactionInstruction> {
  const creatorCEKAccount = await getCekAccountAddress(creatorDID, channel);
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: channel, isSigner: false, isWritable: true },
    { pubkey: creatorDID, isSigner: false, isWritable: false },
    { pubkey: creatorAuthority, isSigner: true, isWritable: false },
    { pubkey: creatorCEKAccount, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.initializeChannel(name, cek).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function initializeDirectChannel(
  payer: PublicKey,
  channel: PublicKey,
  creatorDID: PublicKey,
  creatorAuthority: PublicKey,
  inviteeDID: PublicKey,
  creatorCEK: EncryptedKeyData,
  inviteeCEK: EncryptedKeyData
): Promise<TransactionInstruction> {
  const creatorCEKAccount = await getCekAccountAddress(creatorDID, channel);
  const inviteeCEKAccount = await getCekAccountAddress(inviteeDID, channel);
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: channel, isSigner: false, isWritable: true },
    { pubkey: creatorDID, isSigner: false, isWritable: false },
    { pubkey: creatorAuthority, isSigner: true, isWritable: false },
    { pubkey: creatorCEKAccount, isSigner: false, isWritable: true },
    { pubkey: inviteeDID, isSigner: false, isWritable: false },
    { pubkey: inviteeCEKAccount, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.initializeDirectChannel(
    creatorCEK,
    inviteeCEK
  ).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function post(
  channel: PublicKey,
  senderAuthority: PublicKey,
  message: MessageData
): Promise<TransactionInstruction> {
  const senderCEKAccount = await getCekAccountAddress(
    message.sender.toPublicKey(),
    channel
  );
  const keys: AccountMeta[] = [
    { pubkey: channel, isSigner: false, isWritable: true },
    {
      pubkey: message.sender.toPublicKey(),
      isSigner: false,
      isWritable: false,
    },
    { pubkey: senderAuthority, isSigner: true, isWritable: false },
    { pubkey: senderCEKAccount, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.post(message.content).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function addToChannel(
  payer: PublicKey,
  channel: PublicKey,
  inviteeDID: PublicKey,
  inviterDID: PublicKey,
  inviterAuthority: PublicKey,
  cek: EncryptedKeyData
): Promise<TransactionInstruction> {
  const inviterCEKAccount = await getCekAccountAddress(inviterDID, channel);
  const inviteeCEKAccount = await getCekAccountAddress(inviteeDID, channel);
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: inviteeDID, isSigner: false, isWritable: false },
    { pubkey: inviterDID, isSigner: false, isWritable: false },
    { pubkey: inviterAuthority, isSigner: true, isWritable: false },
    { pubkey: inviterCEKAccount, isSigner: false, isWritable: false },
    { pubkey: inviteeCEKAccount, isSigner: false, isWritable: true },
    { pubkey: channel, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.addToChannel(cek).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function addEncryptedUserKey(
  ownerDID: PublicKey,
  ownerAuthority: PublicKey,
  cek: EncryptedKeyData
): Promise<TransactionInstruction> {
  const ownerCEKAccount = await getUserDetailsAddress(ownerDID);
  const keys: AccountMeta[] = [
    { pubkey: ownerDID, isSigner: false, isWritable: false },
    { pubkey: ownerAuthority, isSigner: true, isWritable: false },
    { pubkey: ownerCEKAccount, isSigner: false, isWritable: true },
  ];
  const data = SolariumInstruction.addEncryptedUserKey(cek).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function removeEncryptedUserKey(
  ownerDID: PublicKey,
  ownerAuthority: PublicKey,
  kid: Kid
): Promise<TransactionInstruction> {
  const ownerCEKAccount = await getUserDetailsAddress(ownerDID);
  const keys: AccountMeta[] = [
    { pubkey: ownerDID, isSigner: false, isWritable: false },
    { pubkey: ownerAuthority, isSigner: true, isWritable: false },
    { pubkey: ownerCEKAccount, isSigner: false, isWritable: true },
  ];
  const data = SolariumInstruction.removeEncryptedUserKey(kid).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function createUserDetails(
  payer: PublicKey,
  did: PublicKey,
  authority: PublicKey,
  alias: string,
  encryptedUserPrivateKeyData: EncryptedKeyData[],
  userPubKey: UserPubKey,
  size?: number
): Promise<TransactionInstruction> {
  const userDetailsAccount = await getUserDetailsAddress(did);
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: did, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: userDetailsAccount, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.createUserDetails(
    alias,
    encryptedUserPrivateKeyData,
    userPubKey,
    undefined,
    size
  ).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function updateUserDetails(
  did: PublicKey,
  authority: PublicKey,
  alias: string,
  addressBook: string
): Promise<TransactionInstruction> {
  const userDetailsAccount = await getUserDetailsAddress(did);
  const keys: AccountMeta[] = [
    { pubkey: did, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: userDetailsAccount, isSigner: false, isWritable: true },
  ];
  const data = SolariumInstruction.updateUserDetails(
    alias,
    addressBook
  ).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

SCHEMA.set(SolariumInstruction, {
  kind: 'enum',
  field: 'enum',
  values: [
    ['initializeChannel', InitializeChannel],
    ['initializeDirectChannel', InitializeDirectChannel],
    ['post', Post],
    ['addToChannel', AddToChannel],
    ['addCEK', AddEncryptedUserKey],
    ['removeEncryptedUserKey', RemoveEncryptedUserKey],
    ['createUserDetails', CreateUserDetails],
    ['updateUserDetails', updateUserDetails],
  ],
});
SCHEMA.set(InitializeChannel, {
  kind: 'struct',
  fields: [
    ['name', 'string'],
    ['cek', EncryptedKeyData],
  ],
});
SCHEMA.set(InitializeDirectChannel, {
  kind: 'struct',
  fields: [
    ['creatorCEK', EncryptedKeyData],
    ['inviteeCEK', EncryptedKeyData],
  ],
});
SCHEMA.set(Post, {
  kind: 'struct',
  fields: [['message', 'string']],
});
SCHEMA.set(AddToChannel, {
  kind: 'struct',
  fields: [['cek', EncryptedKeyData]],
});
SCHEMA.set(AddEncryptedUserKey, {
  kind: 'struct',
  fields: [['keyData', EncryptedKeyData]],
});
SCHEMA.set(RemoveEncryptedUserKey, {
  kind: 'struct',
  fields: [['kid', 'string']],
});
SCHEMA.set(CreateUserDetails, {
  kind: 'struct',
  fields: [
    ['alias', 'string'],
    ['addressBook', 'string'],
    ['size', 'u32'],
    ['encryptedUserPrivateKeyData', [EncryptedKeyData]],
    ['userPubKey', [32]],
  ],
});
SCHEMA.set(UpdateUserDetails, {
  kind: 'struct',
  fields: [
    ['alias', 'string'],
    ['addressBook', 'string'],
  ],
});
