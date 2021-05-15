import React, {useEffect, useMemo, useState} from "react";
import {useConnectionConfig} from "../web3/connection";
import {useLocalStorageState} from "../storage";
import Wallet from "@project-serum/sol-wallet-adapter";
import {notify} from "../notification";
import {useWallet} from "../wallet/wallet";
import {read} from "./solarium";
import {Keypair} from "@solana/web3.js";
import {Subject} from "rxjs";
import {Message} from "solarium-js";

type Props = {
  messages: Message[]
}
const InboxContext = React.createContext<Props>({ messages: []});

export function InboxProvider({ children = null as any }) {
  const { wallet } = useWallet();

  // TODO this will need to be loaded from local storage
  const [ decryptionKey, setDecryptionKey ] = useState<Keypair>(Keypair.generate());
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // subscribe to inbox messages
    const subscription = read(wallet, decryptionKey).subscribe(message => {
      if (message) {
        // add message to local state if not empty
        setMessages(messages => [...messages, message]);
      } else {
        // clear messages when empty message received
        setMessages([]);
      }
    });

    // return unsubscribe method to execute when component unmounts
    return subscription.unsubscribe;
  }, []);

  return (
    <InboxContext.Provider value={{
    messages
  }}>
  {children}
  </InboxContext.Provider>
);