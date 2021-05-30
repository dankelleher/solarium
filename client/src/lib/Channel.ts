import {DecentralizedIdentifier, resolve} from '@identity.com/sol-did-client';
import { currentCluster, ExtendedCluster, PrivateKey } from './util';
import {ChannelData} from "./solana/models/ChannelData";
import {CEKAccountData} from "./solana/models/CEKAccountData";
import {
  CEK,
  decryptCEKs,
  decryptMessage, encryptCEKForDID,
  encryptCEKForVerificationMethod,
  encryptMessage,
  findVerificationMethodForKey
} from "./crypto/ChannelCrypto";
import {PublicKey} from "@solana/web3.js";
import {VerificationMethod} from "did-resolver";
import {CEKData} from "./solana/models/CEKData";

export class Message {
  constructor(readonly sender: string, readonly content: string, readonly timestamp: number) {}
}

export class Channel {
  constructor(readonly name: string, readonly messages: Message[], readonly address: PublicKey, private cek?: CEK) {}

  async encrypt(message: string) {
    if (!this.cek) {
      throw new Error("Cannot encrypt, this channel was loaded without a private key, so no CEK was available")
    }
    return encryptMessage(message, this.cek);
  }

  async encryptCEKForDID(did: string):Promise<CEKData[]> {
    if (!this.cek) {
      throw new Error("Cannot encrypt, this channel was loaded without a private key, so no CEK was available")
    }
    return encryptCEKForDID(this.cek, did);
  }

  async encryptCEK(verificationMethod: VerificationMethod):Promise<CEKData> {
    if (!this.cek) {
      throw new Error("Cannot encrypt, this channel was loaded without a private key, so no CEK was available")
    }
    return encryptCEKForVerificationMethod(this.cek, verificationMethod);
  }

  static async fromChainData(
    address: PublicKey,
    channelData: ChannelData,
    cekAccountData: CEKAccountData,
    memberDID: string,
    memberKey?: PrivateKey,
    cluster?: ExtendedCluster
  ): Promise<Channel> {
    const getCEK = async (key: PrivateKey) => {
      const verificationMethod = findVerificationMethodForKey(memberDIDDocument, key);
      if (!verificationMethod) throw new Error(`Invalid private key for DID ${memberDIDDocument.id}`);
      return decryptCEKs(cekAccountData.ceks, verificationMethod.id, key)
    };

    const decrypt = async (message: Message): Promise<Message> => {
      if (!cek) return message; // only decrypt if a key is provided
      const decrypted = await decryptMessage(message.content, cek);
      return {
        ...message,
        content: decrypted,
      };
    };

    // TODO add caching
    const memberDIDDocument = await resolve(memberDID);
    const cek = memberKey ? await getCEK(memberKey) : undefined;

    const messagePromises = channelData.messages
      .map(
        m => new Message(
          DecentralizedIdentifier.create(
            m.sender.toPublicKey(),
            currentCluster(cluster)
          ).toString(),
          m.content,
          m.timestamp.toNumber()
        )
      )
      .map(decrypt);

    const messages = await Promise.all(messagePromises);

    return new Channel(channelData.name, messages, address, cek);
  }
}
