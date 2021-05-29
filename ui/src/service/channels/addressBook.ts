import {ENDPOINTS} from "../constants";
import {DEFAULT_ENDPOINT_INDEX} from "../web3/connection";
import {getChannel} from "./solarium";
import {Connection} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";

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

export class AddressBookManager {
  constructor() {
  }
  
  static async load(store: AddressBookConfig, connection: Connection, wallet: Wallet, did: string): Promise<AddressBookManager> {
    const currentCluster = ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name;

    const mergedConfig: AddressBookConfig = {
      channels: [...store.channels, ...publicChannelConfig[currentCluster as string]],
      contacts: store.contacts,
    }

    const groupChannelPromises = mergedConfig.channels.map(c => getChannel(connection, wallet, did, c.address));

    const groupChannelResults = await Promise.allSettled(groupChannelPromises)
    
    console.log(groupChannelResults);
    
    return new AddressBookManager()
  }
}