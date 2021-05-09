import {Keypair, PublicKey} from '@solana/web3.js';
import {Assignable, SCHEMA} from './solanaBorsh';
import {encode} from 'bs58';

export class MessageData extends Assignable {
  sender: AssignablePublicKey
  content: string;
}

export class InboxData extends Assignable {
  owner: AssignablePublicKey;
  alias: string;
  messages: MessageData[];

  static fromAccount(
    accountData: Buffer,
  ): InboxData {
    return InboxData.decode<InboxData>(accountData);
  }

  forAuthority(authority: PublicKey) {
    return new InboxData({
      ...this,
      authority: AssignablePublicKey.fromPublicKey(authority),
    });
  }
  
  static empty(owner?: PublicKey): InboxData {
    return new InboxData({
      owner: AssignablePublicKey.fromPublicKey(
        owner || Keypair.generate().publicKey
      ),

      alias: '',
      messages: []
    });
  }
}

export class AssignablePublicKey extends Assignable {
  // The public key bytes
  bytes: number[];

  toPublicKey(): PublicKey {
    return new PublicKey(this.bytes);
  }

  toString(): string {
    return encode(this.bytes);
  }

  static parse(pubkey: string): AssignablePublicKey {
    return AssignablePublicKey.fromPublicKey(new PublicKey(pubkey));
  }

  static fromPublicKey(publicKey: PublicKey): AssignablePublicKey {
    return new AssignablePublicKey({ bytes: Uint8Array.from(publicKey.toBuffer()) });
  }

  static empty(): AssignablePublicKey {
    const bytes = new Array(32);
    bytes.fill(0);
    return new AssignablePublicKey({ bytes });
  }
}

SCHEMA.set(InboxData, {
  kind: 'struct',
  fields: [
    ['owner', AssignablePublicKey],
    ['alias', 'string'],
    ['messages', [MessageData]],
  ],
});
SCHEMA.set(MessageData, {
  kind: 'struct',
  fields: [
    ['timestamp', 'u8'],
    ['sender', AssignablePublicKey],
    ['content', 'string'],
  ],
});
SCHEMA.set(AssignablePublicKey, {
  kind: 'struct',
  fields: [['bytes', [32]]],
});