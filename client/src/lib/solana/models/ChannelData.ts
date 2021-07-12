import { Assignable, SCHEMA } from '../solanaBorsh';
import { MessageData } from './MessageData';
import { DEFAULT_MAX_MESSAGE_COUNT, MESSAGE_SIZE_BYTES } from '../../constants';

export class ChannelData extends Assignable {
  name: string;
  messages: MessageData[];

  static fromAccount(accountData: Buffer): ChannelData {
    return ChannelData.decode<ChannelData>(accountData);
  }

  static empty(name: string): ChannelData {
    return new ChannelData({
      name,
      messages: [],
    });
  }

  // The size of a channel in bytes - must match size_bytes in state.rs
  static sizeBytes(): number {
    return MESSAGE_SIZE_BYTES * DEFAULT_MAX_MESSAGE_COUNT + 64;
  }
}

SCHEMA.set(ChannelData, {
  kind: 'struct',
  fields: [
    ['name', 'string'],
    ['messages', [MessageData]],
  ],
});
