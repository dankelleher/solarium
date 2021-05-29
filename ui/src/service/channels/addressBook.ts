import {ENDPOINTS} from "../constants";
import {DEFAULT_ENDPOINT_INDEX} from "../web3/connection";
import {getChannel, getDirectChannel} from "./solarium";
import {Connection, Keypair} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import {Channel} from "solarium-js";

type PublicChannelConfig = { [key: string]: GroupChannelConfig[] }
const publicChannelConfig: PublicChannelConfig = require('./publicChannels.json');

type GroupChannelConfig ={
  name: string,
  address: string,
  inviteAuthority: string
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

export class AddressBookManager {
  constructor(readonly groupChannels: Channel[], readonly directChannels: DirectChannel[]) {
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
    
    return new AddressBookManager(groupChannels, directChannels)
  }
}