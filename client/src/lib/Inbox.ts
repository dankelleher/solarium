import { InboxData } from './solana/InboxData';
import { DecentralizedIdentifier } from '@identity.com/sol-did-client';
import { PublicKey } from '@solana/web3.js';
import { getKeyFromOwner } from './solana/instruction';
import { currentCluster, ExtendedCluster, PrivateKey } from './util';
import { SolariumCrypto } from './crypto/SolariumCrypto';
import { decompress } from './compression';

export class Message {
  constructor(readonly sender: string, readonly content: string) {}
}

export class Inbox {
  constructor(readonly owner: string, readonly messages: Message[]) {}

  static async fromChainData(
    inboxData: InboxData,
    ownerKey?: PrivateKey,
    cluster?: ExtendedCluster
  ): Promise<Inbox> {
    const ownerDID = DecentralizedIdentifier.create(
      inboxData.owner.toPublicKey(),
      currentCluster(cluster)
    ).toString();

    const decrypt = async (message: Message): Promise<Message> => {
      if (!ownerKey) return message; // only decrypt if a key is provided
      const crypto = new SolariumCrypto(ownerDID, ownerKey);
      const compressedBytes = Buffer.from(message.content, 'base64'); // TODO change program to accept byte arrays
      console.log('CompressedBytes ' + compressedBytes.length);
      const jwe = decompress(compressedBytes);
      const decrypted = await crypto.decrypt(jwe);
      return {
        ...message,
        content: decrypted,
      };
    };

    const messagePromises = inboxData.messages
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

    return new Inbox(ownerDID, messages);
  }

  async address(): Promise<PublicKey> {
    const ownerKey = DecentralizedIdentifier.parse(
      this.owner
    ).pubkey.toPublicKey();
    return getKeyFromOwner(ownerKey);
  }

  get ownerDID(): string {
    return DecentralizedIdentifier.parse(this.owner).toString();
  }
}
