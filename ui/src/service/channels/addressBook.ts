import {ENDPOINTS} from "../constants";
import {DEFAULT_ENDPOINT_INDEX} from "../web3/connection";
import {addToChannel, cluster, getChannel, getDirectChannel} from "./solarium";
import {Connection, Keypair} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {Channel} from "solarium-js";
import * as u8a from 'uint8arrays'

type PublicChannelConfig = { [key: string]: GroupChannelConfig[] }
export const publicChannelConfig: PublicChannelConfig = require('./publicChannels.json');

export const publicChannelConfigByName = (name:string) => 
  publicChannelConfig[cluster!]
    .find(config => config.name === name)

type GroupChannelConfig ={
  name: string,
  address: string,
  inviteAuthority?: string
}
type ContactConfig = {
  alias: string,
  did: string
}
export type AddressBookConfig = {
  channels: GroupChannelConfig[],
  contacts: ContactConfig[]
}

export const emptyAddressBookConfig: AddressBookConfig = {
  channels: [], contacts: []
}

export type DirectChannel = {
  contact :ContactConfig,
  channel: Channel
}

export const isGroupChannel = 
  (groupOrDirectChannel: Channel | DirectChannel): groupOrDirectChannel is Channel =>
    Object.prototype.hasOwnProperty.call(groupOrDirectChannel, 'address')

const base58ToBytes = (s: string) => u8a.fromString(s, 'base58btc')

export class AddressBookManager {
  constructor(
    private connection: Connection,
    private wallet: Wallet,
    private did: string,
    private decryptionKey: Keypair,
    readonly groupChannels: Channel[],
    readonly directChannels: DirectChannel[]) {
  }
  
  getChannelByName(name: string): Channel | undefined {
    return this.groupChannels.find(c => c.name === name);
  }

  getDirectChannelByContactDID(did: string): DirectChannel | undefined {
    return this.directChannels.find(c => c.contact.did === did);
  }

  getDirectChannelByContactAlias(alias: string): DirectChannel | undefined {
    return this.directChannels.find(c => c.contact.alias === alias);
  }
  
  getGroupOrDirectChannelByAddress(address: string) : Channel | DirectChannel | undefined {
    const groupChannel = this.groupChannels.find(c => c.address.toBase58() === address);
    if (groupChannel) return groupChannel;

    const directChannel = this.directChannels.find(dc => dc.channel.address.toBase58() === address);
    if (directChannel) return directChannel;
  }

  async joinChannel(channelConfig: GroupChannelConfig): Promise<Channel> {
    console.log(`Joining channel ${channelConfig.name}`);
    if (!channelConfig.inviteAuthority) {
      throw new Error("Cannot join " + channelConfig.name + " - no invite authority");
    }
    
    const inviteAuthorityKeypair = Keypair.fromSecretKey(base58ToBytes(channelConfig.inviteAuthority));

    await addToChannel(this.connection, this.wallet, channelConfig.address, inviteAuthorityKeypair, this.did)
    
    const channel = await getChannel(this.connection, this.wallet, this.did, channelConfig.address, this.decryptionKey);
    
    if (!channel) throw new Error("Unable to retrieve channel " + channelConfig.name);
    
    this.groupChannels.push(channel);
    
    return channel;
  }

  static async load(store: AddressBookConfig, connection: Connection, wallet: Wallet, did: string, decryptionKey: Keypair): Promise<AddressBookManager> {
    const currentCluster = ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name;

    const mergedConfig: AddressBookConfig = {
      channels: [...store.channels, ...publicChannelConfig[currentCluster as string]],
      contacts: store.contacts,
    }

    const groupChannelPromises = mergedConfig.channels.map(c => getChannel(connection, wallet, did, c.address, decryptionKey));

    const groupChannelResults = await Promise.allSettled(groupChannelPromises)
    
    const groupChannels = groupChannelResults
      .filter(result => result.status === 'fulfilled')
      // @ts-ignore
      .map(result => result.value)

    const directChannelsPromises = mergedConfig.contacts.map(async (contact):Promise<DirectChannel> => {
      const channel = await getDirectChannel(
        connection,
        wallet,
        contact.did,
        decryptionKey
        )
      
      if (!channel) throw new Error("No direct channel created for contact " + contact.did);
      
      return {
        channel,
        contact
      }
    })
    
    const directChannels = await Promise.all(directChannelsPromises);
    
    return new AddressBookManager(
      connection,
      wallet,
      did,
      decryptionKey,
      groupChannels,
      directChannels
    )
  }
}