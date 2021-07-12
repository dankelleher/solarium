import { DecentralizedIdentifier } from '@identity.com/sol-did-client';
import { currentCluster, ExtendedCluster, PrivateKey } from './util';
import { ChannelData } from './solana/models/ChannelData';
import { CEKAccountData } from './solana/models/CEKAccountData';
import {
  CEK,
  decryptCEKs,
  decryptMessage,
  encryptCEKForDID,
  encryptCEKForVerificationMethod,
  encryptMessage,
  findVerificationMethodForKey,
} from './crypto/ChannelCrypto';
import { PublicKey } from '@solana/web3.js';
import { VerificationMethod } from 'did-resolver';
import { CEKData } from './solana/models/CEKData';
import { getCekAccountKey } from './solana/instruction';
import { SolanaUtil } from './solana/solanaUtil';
import { getUserDetails } from '../service/userDetails';
import { getDocument } from './did/get';

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

    const userDetails = await getUserDetails(senderDID, connection);
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

  async encryptCEKForDID(did: string): Promise<CEKData[]> {
    if (!this.cek) {
      throw new Error(
        'Cannot encrypt, this channel was loaded without a private key, so no CEK was available'
      );
    }
    return encryptCEKForDID(this.cek, did);
  }

  async encryptCEK(verificationMethod: VerificationMethod): Promise<CEKData> {
    if (!this.cek) {
      throw new Error(
        'Cannot encrypt, this channel was loaded without a private key, so no CEK was available'
      );
    }
    return encryptCEKForVerificationMethod(this.cek, verificationMethod);
  }

  async hasMember(did: PublicKey): Promise<boolean> {
    const cekAccount = await getCekAccountKey(did, this.address);

    const connection = SolanaUtil.getConnection(this.cluster);

    const cekAccountInfo = await connection.getAccountInfo(cekAccount);

    return !!cekAccountInfo;
  }

  static async fromChainData(
    address: PublicKey,
    channelData: ChannelData,
    cekAccountData: CEKAccountData,
    memberDID: string,
    memberKey?: PrivateKey,
    cluster?: ExtendedCluster
  ): Promise<Channel> {
    const getCEK = async (key: PrivateKey): Promise<Uint8Array> => {
      const verificationMethod = findVerificationMethodForKey(
        memberDIDDocument,
        key
      );
      if (!verificationMethod)
        throw new Error(`Invalid private key for DID ${memberDIDDocument.id}`);
      return decryptCEKs(cekAccountData.ceks, verificationMethod.id, key);
    };

    const decrypt = async (message: Message): Promise<Message> => {
      if (!cek) return message; // only decrypt if a key is provided
      const decrypted = await decryptMessage(message.content, cek);
      return message.withContent(decrypted);
    };

    const memberDIDDocument = await getDocument(memberDID);
    const cek = memberKey ? await getCEK(memberKey) : undefined;

    const messagePromises = channelData.messages
      .map(m =>
        Message.build(m.sender.toPublicKey(), m.content, m.timestamp.toNumber())
      )
      .map(messagePromise => messagePromise.then(decrypt));

    const messages = await Promise.all(messagePromises);

    return new Channel(channelData.name, messages, address, cek, cluster);
  }
}
