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
import {getCekAccountKey} from "./solana/instruction";
import {SolanaUtil} from "./solana/solanaUtil";
import {UserDetailsData} from "./solana/models/UserDetailsData";

// TODO
export class AddressBook {
  constructor() {}
}

export class UserDetails {
  constructor(readonly alias: string, readonly addressBook: AddressBook) {}


  static async fromChainData(
    userDetailsData: UserDetailsData
  ): Promise<UserDetails> {
    // TODO decrypt address book
    const addressBook = new AddressBook();

    return new UserDetails(userDetailsData.alias, addressBook);
  }
}
