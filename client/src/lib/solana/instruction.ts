import { Enum, Assignable, SCHEMA } from './solanaBorsh';
import {NONCE_SEED_STRING, PROGRAM_ID} from '../constants';
import {
  AccountMeta,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';

export class Initialize extends Assignable {}

export class Post extends Assignable {
  content: string;
}

export class CloseAccount extends Assignable {}

export class SolariumInstruction extends Enum {
  initialize: Initialize;
  post: Post;
  closeAccount: CloseAccount;

  static initialize(): SolariumInstruction {
    return new SolariumInstruction({
      initialize: new Initialize({}),
    });
  }

  static post(content: string): SolariumInstruction {
    return new SolariumInstruction({ post: new Post({ content }) });
  }

  static closeAccount(): SolariumInstruction {
    return new SolariumInstruction({ closeAccount: new CloseAccount({}) });
  }
}

export async function getKeyFromOwner(
  owner: PublicKey
): Promise<PublicKey> {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [owner.toBuffer(), Buffer.from(NONCE_SEED_STRING, 'utf8')],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
}

export function initialize(
  inboxAddress: PublicKey,
  owner: PublicKey,
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: inboxAddress, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.initialize().encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export function post(
  inboxAddress: PublicKey,
  senderDID: PublicKey,
  signer: PublicKey,
  message: string
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: inboxAddress, isSigner: false, isWritable: true },
    { pubkey: senderDID, isSigner: false, isWritable: false },
    { pubkey: signer, isSigner: true, isWritable: false },
  ];
  const data = SolariumInstruction.post(message).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export function closeAccount(
  inboxAddress: PublicKey,
  ownerDID: PublicKey,
  owner: PublicKey,
  receiver: PublicKey
): TransactionInstruction {
  const keys: AccountMeta[] = [
    // the Inbox to close
    { pubkey: inboxAddress, isSigner: false, isWritable: true },
    // the owner DID of the inbox
    { pubkey: ownerDID, isSigner: false, isWritable: false },
    // a signer of the owner DID
    { pubkey: owner, isSigner: true, isWritable: false },
    // the account to receive the lamports
    { pubkey: receiver, isSigner: false, isWritable: false },
  ];
  const data = SolariumInstruction.closeAccount().encode();
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
    ['initialize', Initialize],
    ['post', Post],
    ['closeAccount', CloseAccount],
  ],
});
SCHEMA.set(Initialize, {
  kind: 'struct',
  fields: [],
});
SCHEMA.set(Post, {
  kind: 'struct',
  fields: [
    ['content', 'string'],
  ],
});
SCHEMA.set(CloseAccount, { kind: 'struct', fields: [] });
