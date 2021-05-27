import {ENDPOINTS} from "../constants";
import {DEFAULT_ENDPOINT_INDEX} from "../web3/connection";
import {getChannel} from "./solarium";
import {Connection} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";

const publicChannelConfig: AddressBookConfig = require('./publicChannels.json');

type GroupChannelConfig ={
  name: string,
  address: string,
  inviteAuthority: string
}
type ContactConfig = {
  alias: string,
  did: string
}
type AddressBookConfig = {
  channels: GroupChannelConfig[],
  contacts: ContactConfig[]
}

export class AddressBookManager {
  constructor() {
  }
  
  static async load(store: AddressBookConfig, connection: Connection, wallet: Wallet): Promise<AddressBookManager> {
    const currentCluster = ENDPOINTS[DEFAULT_ENDPOINT_INDEX].name;

    const mergedConfig: AddressBookConfig = {
      channels: [...store.channels, ...publicChannelConfig.channels],
      contacts: [...store.contacts, ...publicChannelConfig.contacts],
    }

    const groupChannelPromises = mergedConfig.channels.map(c => getChannel(connection, wallet, c.address));

    const groupChannelResults = await Promise.allSettled(groupChannelPromises)
    
    console.log(groupChannelResults);
    
    return new AddressBookManager()
  }
}