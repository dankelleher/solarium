import {ENDPOINTS} from "../constants";
import {DEFAULT_ENDPOINT_INDEX} from "../web3/connection";
import {addToChannel, getChannel, getDirectChannel, getOrCreateDirectChannel, createChannel} from "./solarium";
import {Connection, Keypair} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {Channel} from "solarium-js";
import * as u8a from 'uint8arrays'
import {Dir} from "fs";

const cluster = ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name;

type PublicChannelConfig = { [key: string]: GroupChannelConfig[] }
export const publicChannelConfig: PublicChannelConfig = require('./publicChannels.json');

export const publicChannelConfigByName = (name:string) =>
  publicChannelConfig[cluster]
    .find(config => config.name === name)

type GroupChannelConfig ={
  name: string,
  address: string,
  inviteAuthority?: string
}
export type ContactConfig = {
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

export enum ChannelType {
  Group,
  Direct
}

export type DirectChannel = {
  type: ChannelType
  contact: ContactConfig,
  channel: Channel
}

export type GroupChannel = {
  type: ChannelType
  inviteAuthority?: string,
  channel: Channel
}

export const isGroupChannel =
  (groupOrDirectChannel: Channel | DirectChannel): groupOrDirectChannel is Channel =>
    Object.prototype.hasOwnProperty.call(groupOrDirectChannel, 'address')

const base58ToBytes = (s: string) => u8a.fromString(s, 'base58btc')

const distinct = (groupChannelConfigs: GroupChannelConfig[]) =>
  Object.values(
    groupChannelConfigs.reduce<Record<string, GroupChannelConfig>>(
      (map, gcc) => ({ ...map, [gcc.address]: gcc }),
      {} as Record<string, GroupChannelConfig>)
  )

export class AddressBookManager {
  constructor(
    private connection: Connection,
    private wallet: Wallet,
    private did: string,
    private decryptionKey: Keypair,
    readonly groupChannels: GroupChannel[],
    readonly directChannels: DirectChannel[],
    readonly updateCallback: (store: AddressBookConfig) => void
  ) {
  }

  getChannelByName(name: string): Channel | undefined {
    return this.groupChannels.find(gc => gc.channel.name === name)?.channel;
  }

  getDirectChannelByContactDID(did: string): DirectChannel | undefined {
    return this.directChannels.find(c => c.contact.did === did);
  }

  getDirectChannelByContactAlias(alias: string): DirectChannel | undefined {
    return this.directChannels.find(c => c.contact.alias === alias);
  }

  getGroupOrDirectChannelByAddress(address: string) : Channel | undefined {
    const groupChannel = this.groupChannels.find(gc => gc.channel.address.toBase58() === address);
    if (groupChannel) return groupChannel.channel;

    const directChannel = this.directChannels.find(dc => dc.channel.address.toBase58() === address);
    if (directChannel) return directChannel.channel;
  }

  isOwnDid(did: string): boolean {
    return did === this.did
  }

  // if the DID is in this addressbook, return its alias, else return the did
  getDIDViewName(did: string) : string {
    if (did === this.did) return "Me";
    return this.directChannels.find(dc => dc.contact.did === did)?.contact.alias || did;
  }

  // if the channel is a direct channel in this addressbook, return the contact alias, else return the channel name
  getChannelViewName(channel: DirectChannel | GroupChannel) : string {
    if (channel.type === ChannelType.Direct)
      return (channel as DirectChannel).contact.alias

    return (channel as GroupChannel).channel.name
  }

  findChannel(channel: Channel): DirectChannel | GroupChannel {
    const found = this.directChannels.find(dc => dc.channel.address === channel.address) ||
      this.groupChannels.find(gc => gc.channel.address === channel.address)

    if (!found) {
      throw new Error("No Direct of Group channel found with " + channel.address.toBase58());
    }

    return found
  }

  async joinChannel(channelConfig: GroupChannelConfig): Promise<Channel> {
    if (!channelConfig.inviteAuthority) {
      throw new Error("Cannot join " + channelConfig.name + " - no invite authority");
    }

    const inviteAuthorityKeypair = Keypair.fromSecretKey(base58ToBytes(channelConfig.inviteAuthority));

    await addToChannel(this.connection, this.wallet, channelConfig.address, inviteAuthorityKeypair, this.did)

    const channel = await getChannel(this.connection, this.wallet, this.did, channelConfig.address, this.decryptionKey);

    if (!channel) throw new Error("Unable to retrieve channel " + channelConfig.name);

    this.groupChannels.push({ type: ChannelType.Group, channel, inviteAuthority: channelConfig.inviteAuthority });

    this.store();

    return channel;
  }

  async inviteToChannel(channelBase58: string, inviteeDid: string) {
    await addToChannel(this.connection, this.wallet, channelBase58, this.decryptionKey, inviteeDid)
  }

  async createChannel(name: string) {
    console.log(`Creating new channel: ${name}`)
    const channel = await createChannel(this.connection, this.wallet, name)
    this.groupChannels.push({ type: ChannelType.Group, channel });

    this.store()

    return channel
  }

  async addContact(did: string, alias: string):Promise<DirectChannel> {
    const foundDirectChannel = this.getDirectChannelByContactDID(did);
    if (foundDirectChannel) return foundDirectChannel;

    const channel = await getOrCreateDirectChannel(this.connection, this.wallet, did, this.decryptionKey);
    const directChannel = { type: ChannelType.Direct, contact: { did, alias }, channel }

    this.directChannels.push(directChannel);

    this.store();

    return directChannel;
  }

  private store() {
    const config: AddressBookConfig = {
      channels: this.groupChannels.map(gc => ({
        name: gc.channel.name,
        address: gc.channel.address.toBase58(),
        inviteAuthority: gc.inviteAuthority
      })),
      contacts: this.directChannels.map(dc => dc.contact)
    }

    this.updateCallback(config);
  }

  static async load(store: AddressBookConfig, connection: Connection, wallet: Wallet, did: string, decryptionKey: Keypair, updateCallback: (store: AddressBookConfig) => void): Promise<AddressBookManager> {
    const mergedConfig: AddressBookConfig = {
      channels: distinct([...store.channels, ...publicChannelConfig[cluster as string]]),
      contacts: store.contacts,
    }

    const groupChannelPromises = mergedConfig.channels.map(async (gc):Promise<GroupChannel> => {
      const channel = await getChannel(connection, wallet, did, gc.address, decryptionKey)
      if (!channel) throw new Error("Cannot find channel " + gc.address)
      return {
        type: ChannelType.Group,
        channel,
        inviteAuthority: gc.inviteAuthority
      }
    });

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
        type: ChannelType.Direct,
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
      directChannels,
      updateCallback
    )
  }
}
