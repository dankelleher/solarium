import { DecentralizedIdentifier } from '@identity.com/sol-did-client';
import { currentCluster, ExtendedCluster, PrivateKey } from './util';
import {ChannelData} from "./solana/models/ChannelData";
import {CEKAccountData} from "./solana/models/CEKAccountData";
import {decryptCEKs, decryptMessage} from "./crypto/ChannelCrypto";

export class Message {
  constructor(readonly sender: string, readonly content: string) {}
}

export class Channel {
  constructor(readonly name: string, readonly messages: Message[]) {}

  static async fromChainData(
    channelData: ChannelData,
    cekAccountData: CEKAccountData,
    ownerKey?: PrivateKey,
    cluster?: ExtendedCluster
  ): Promise<Channel> {

    const decrypt = async (message: Message): Promise<Message> => {
      if (!ownerKey) return message; // only decrypt if a key is provided
      // TODO pass the kid
      const cek = await decryptCEKs(cekAccountData.ceks, "TODO",  ownerKey)
      const decrypted = await decryptMessage(message.content, cek);
      return {
        ...message,
        content: decrypted,
      };
    };

    const messagePromises = channelData.messages
      .map(
        m =>
          new Message(
            DecentralizedIdentifier.create(
              m.sender.toPublicKey(),
              currentCluster(cluster)
            ).toString(),
            m.content
          )
      )
      .map(decrypt);

    const messages = await Promise.all(messagePromises);

    return new Channel(channelData.name, messages);
  }
}
