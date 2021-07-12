import { Assignable, AssignablePublicKey, SCHEMA } from '../solanaBorsh';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export class MessageData extends Assignable {
  timestamp: BN;
  sender: AssignablePublicKey;
  content: string;

  static for(senderDID: PublicKey, content: string): MessageData {
    return new MessageData({
      timestamp: 0,
      sender: AssignablePublicKey.fromPublicKey(senderDID),
      content,
    });
  }
}

SCHEMA.set(MessageData, {
  kind: 'struct',
  fields: [
    ['timestamp', 'u64'],
    ['sender', AssignablePublicKey],
    ['content', 'string'],
  ],
});
