import {InboxData} from "./solana/InboxData";
import {DecentralizedIdentifier} from "@identity.com/sol-did-client";
import {DEFAULT_CLUSTER} from "./constants";
import {PublicKey} from "@solana/web3.js";
import {getKeyFromOwner} from "./solana/instruction";
import {PrivateKey} from "./util";
import {SolariumCrypto} from "./crypto/SolariumCrypto";
import {decode} from "./compression";

export class Message {
  constructor(readonly sender: string, readonly content: string ) {}
}


export class Inbox {
  constructor(readonly owner: string, readonly messages: Message[]) {}
  
  static async fromChainData(inboxData: InboxData, ownerKey?: PrivateKey): Promise<Inbox> {
    const ownerDID = DecentralizedIdentifier.create(inboxData.owner.toPublicKey(), DEFAULT_CLUSTER).toString();
    
    const decrypt = async (message: Message):Promise<Message> => {
      if (!ownerKey) return message;  // only decrypt if a key is provided
      const crypto = new SolariumCrypto(ownerDID, ownerKey)
      const decoded = decode(Buffer.from(message.content, 'base64'));
      const decrypted = await crypto.decrypt(decoded)
      return {
        ...message,
        content: decrypted
      }
    }
    
    const messagePromises = inboxData.messages.map(
      (m) => new Message(
        DecentralizedIdentifier.create(m.sender.toPublicKey(), DEFAULT_CLUSTER).toString(),
        m.content
      )).map(decrypt)

    const messages = await Promise.all(messagePromises);
    
    return new Inbox(
      ownerDID,
      messages
    )
  }
  
  async address():Promise<PublicKey> {
    const ownerKey = DecentralizedIdentifier.parse(this.owner).pubkey.toPublicKey()
    return getKeyFromOwner(ownerKey);
  }
}