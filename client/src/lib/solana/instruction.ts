import { Enum, Assignable, SCHEMA } from './solanaBorsh';
import {
  CEK_ACCOUNT_NONCE_SEED_STRING,
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
import { CEKData } from './models/CEKData';
import { MessageData } from './models/MessageData';

export class InitializeChannel extends Assignable {
  name: string;
  CEKs: CEKData[];
}

export class InitializeDirectChannel extends Assignable {
  creatorCEKs: CEKData[];
  inviteeCEKs: CEKData[];
}

export class Post extends Assignable {
  message: string;
}

export class AddToChannel extends Assignable {
  CEKs: CEKData[];
}

export class AddCEK extends Assignable {
  cek: CEKData;
}

export class RemoveCEK extends Assignable {
  kid: string;
}

export class CreateUserDetails extends Assignable {
  alias: string;
  addressBook: string;
  size: number;
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
  addCEK: AddCEK;
  removeCEK: RemoveCEK;
  createUserDetails: CreateUserDetails;
  updateUserDetails: UpdateUserDetails;

  static initializeChannel(name: string, CEKs: CEKData[]): SolariumInstruction {
    return new SolariumInstruction({
      initializeChannel: new InitializeChannel({ name, CEKs }),
    });
  }

  static initializeDirectChannel(
    creatorCEKs: CEKData[],
    inviteeCEKs: CEKData[]
  ): SolariumInstruction {
    return new SolariumInstruction({
      initializeDirectChannel: new InitializeDirectChannel({
        creatorCEKs,
        inviteeCEKs,
      }),
    });
  }

  static post(message: string): SolariumInstruction {
    return new SolariumInstruction({ post: new Post({ message }) });
  }

  static addToChannel(CEKs: CEKData[]): SolariumInstruction {
    return new SolariumInstruction({
      addToChannel: new AddToChannel({ CEKs }),
    });
  }

  static addCEK(cek: CEKData): SolariumInstruction {
    return new SolariumInstruction({
      addCEK: new AddCEK({ cek }),
    });
  }

  static removeCEK(kid: string): SolariumInstruction {
    return new SolariumInstruction({
      removeCEK: new RemoveCEK({ kid }),
    });
  }

  static createUserDetails(
    alias: string,
    addressBook = '',
    size: number = DEFAULT_USER_DETAILS_SIZE
  ): SolariumInstruction {
    return new SolariumInstruction({
      createUserDetails: new CreateUserDetails({ alias, addressBook, size }),
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

export async function getCekAccountKey(
  ownerDID: PublicKey,
  channel: PublicKey
): Promise<PublicKey> {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [
      ownerDID.toBuffer(),
      channel.toBuffer(),
      Buffer.from(CEK_ACCOUNT_NONCE_SEED_STRING, 'utf8'),
    ],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
}

export async function getUserDetailsKey(did: PublicKey): Promise<PublicKey> {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [
      did.toBuffer(),
      Buffer.from(USER_DETAILS_ACCOUNT_NONCE_SEED_STRING, 'utf8'),
    ],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
}

export async function getDirectChannelAccountKey(
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
  CEKs: CEKData[]
): Promise<TransactionInstruction> {
  const creatorCEKAccount = await getCekAccountKey(creatorDID, channel);
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: channel, isSigner: false, isWritable: true },
    { pubkey: creatorDID, isSigner: false, isWritable: false },
    { pubkey: creatorAuthority, isSigner: true, isWritable: false },
    { pubkey: creatorCEKAccount, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.initializeChannel(name, CEKs).encode();
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
  creatorCEKs: CEKData[],
  inviteeCEKs: CEKData[]
): Promise<TransactionInstruction> {
  const creatorCEKAccount = await getCekAccountKey(creatorDID, channel);
  const inviteeCEKAccount = await getCekAccountKey(inviteeDID, channel);
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
    creatorCEKs,
    inviteeCEKs
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
  const senderCEKAccount = await getCekAccountKey(
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
  CEKs: CEKData[]
): Promise<TransactionInstruction> {
  const inviterCEKAccount = await getCekAccountKey(inviterDID, channel);
  const inviteeCEKAccount = await getCekAccountKey(inviteeDID, channel);
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
  const data = SolariumInstruction.addToChannel(CEKs).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function addCEK(
  channel: PublicKey,
  ownerDID: PublicKey,
  ownerAuthority: PublicKey,
  cek: CEKData
): Promise<TransactionInstruction> {
  const ownerCEKAccount = await getCekAccountKey(ownerDID, channel);
  const keys: AccountMeta[] = [
    { pubkey: ownerDID, isSigner: false, isWritable: false },
    { pubkey: ownerAuthority, isSigner: true, isWritable: false },
    { pubkey: ownerCEKAccount, isSigner: false, isWritable: true },
  ];
  const data = SolariumInstruction.addCEK(cek).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export async function removeCEK(
  channel: PublicKey,
  ownerDID: PublicKey,
  ownerAuthority: PublicKey,
  kid: string
): Promise<TransactionInstruction> {
  const ownerCEKAccount = await getCekAccountKey(ownerDID, channel);
  const keys: AccountMeta[] = [
    { pubkey: ownerDID, isSigner: false, isWritable: false },
    { pubkey: ownerAuthority, isSigner: true, isWritable: false },
    { pubkey: ownerCEKAccount, isSigner: false, isWritable: true },
  ];
  const data = SolariumInstruction.removeCEK(kid).encode();
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
  size?: number
): Promise<TransactionInstruction> {
  const userDetailsAccount = await getUserDetailsKey(did);
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
  const userDetailsAccount = await getUserDetailsKey(did);
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
    ['addCEK', AddCEK],
    ['removeCEK', RemoveCEK],
    ['createUserDetails', CreateUserDetails],
    ['updateUserDetails', updateUserDetails],
  ],
});
SCHEMA.set(InitializeChannel, {
  kind: 'struct',
  fields: [
    ['name', 'string'],
    ['CEKs', [CEKData]],
  ],
});
SCHEMA.set(InitializeDirectChannel, {
  kind: 'struct',
  fields: [
    ['creatorCEKs', [CEKData]],
    ['inviteeCEKs', [CEKData]],
  ],
});
SCHEMA.set(Post, {
  kind: 'struct',
  fields: [['message', 'string']],
});
SCHEMA.set(AddToChannel, {
  kind: 'struct',
  fields: [['CEKs', [CEKData]]],
});
SCHEMA.set(AddCEK, {
  kind: 'struct',
  fields: [['cek', CEKData]],
});
SCHEMA.set(RemoveCEK, {
  kind: 'struct',
  fields: [['kid', 'string']],
});
SCHEMA.set(CreateUserDetails, {
  kind: 'struct',
  fields: [
    ['alias', 'string'],
    ['addressBook', 'string'],
    ['size', 'u32'],
  ],
});
SCHEMA.set(UpdateUserDetails, {
  kind: 'struct',
  fields: [
    ['alias', 'string'],
    ['addressBook', 'string'],
  ],
});
