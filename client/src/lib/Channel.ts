import { DecentralizedIdentifier } from '@identity.com/sol-did-client';
import { currentCluster, ExtendedCluster } from './util';
import { ChannelData } from './solana/models/ChannelData';
import { CEKAccountDataV2 } from './solana/models/CEKAccountDataV2';
import {
  CEK,
  decryptKeyWrap,
  decryptMessage,
  encryptCEKForUserKey,
  encryptMessage, UserPrivateKey,
} from './crypto/SolariumCrypto';
import { PublicKey } from '@solana/web3.js';
import { getCekAccountAddress } from './solana/instruction';
import { SolanaUtil } from './solana/solanaUtil';
import { getUserDetails } from '../service/userDetails';
import { EncryptedKey, UserPubKey } from './UserDetails';

export type MessageSender = {
  did: string;
  alias?: string;
};

export class Message {
  constructor(
    readonly sender: MessageSender,
    readonly content: string,
    readonly timestamp: number
  ) {}

  // Returns the display name for the sender of this message - either an alias or did.
  displayableSender(): string {
    return this.sender.alias || this.sender.did;
  }

  withContent(content: string): Message {
    return new Message(this.sender, content, this.timestamp);
  }

  static async build(
    senderDIDKey: PublicKey,
    content: string,
    timestamp: number,
    cluster?: ExtendedCluster
  ): Promise<Message> {
    const senderDID = DecentralizedIdentifier.create(
      senderDIDKey,
      currentCluster(cluster)
    ).toString();

    const connection = SolanaUtil.getConnection(cluster);

    const userDetails = await getUserDetails(senderDID, false, connection);
    const alias = userDetails ? userDetails.alias : undefined;

    return new Message({ did: senderDID, alias }, content, timestamp);
  }
}

export class Channel {
  constructor(
    readonly name: string,
    readonly messages: Message[],
    readonly address: PublicKey,
    private cek?: CEK,
    private cluster?: ExtendedCluster
  ) {}

  async encrypt(message: string): Promise<string> {
    if (!this.cek) {
      throw new Error(
        'Cannot encrypt, this channel was loaded without a private key, so no CEK was available'
      );
    }
    return encryptMessage(message, this.cek);
  }

  async encryptCEKForUserKey(userkey: UserPubKey): Promise<EncryptedKey> {
    if (!this.cek) {
      throw new Error(
        'Cannot encrypt, this channel was loaded without a private key, so no CEK was available'
      );
    }
    return encryptCEKForUserKey(this.cek, userkey);
  }

  async hasMember(did: PublicKey): Promise<boolean> {
    const cekAccount = await getCekAccountAddress(did, this.address);

    const connection = SolanaUtil.getConnection(this.cluster);

    const cekAccountInfo = await connection.getAccountInfo(cekAccount);

    return !!cekAccountInfo;
  }

  static async fromChainData(
    address: PublicKey,
    channelData: ChannelData,
    cekAccountData: CEKAccountDataV2,
    userKey?: UserPrivateKey,
    cluster?: ExtendedCluster
  ): Promise<Channel> {
    const getCEK = async (key: UserPrivateKey): Promise<Uint8Array> => {
      return decryptKeyWrap(EncryptedKey.fromChainData(cekAccountData.cek), key);
    };

    const decrypt = async (message: Message): Promise<Message> => {
      if (!cek) return message; // only decrypt if a key is provided
      const decrypted = await decryptMessage(message.content, cek);
      return message.withContent(decrypted);
    };

    const cek = userKey ? await getCEK(userKey) : undefined;

    const messagePromises = channelData.messages
      .map(m =>
        Message.build(
          m.sender.toPublicKey(),
          m.content,
          m.timestamp.toNumber(),
          cluster
        )
      )
      .map(messagePromise => messagePromise.then(decrypt));

    const messages = await Promise.all(messagePromises);

    return new Channel(channelData.name, messages, address, cek, cluster);
  }
}
