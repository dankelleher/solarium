import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {useLocalStorageKey, useLocalStorageState} from "../storage";
import {useWallet} from "../wallet/wallet";
import {get, read, createInbox, addKey, postToInbox} from "./solarium";
import {Keypair} from "@solana/web3.js";
import {keyToIdentifier, Message} from "solarium-js";
import {useConnection} from "../web3/connection";
import {useIdentity} from "../identity";

type Inbox = {
  ownerDID: string
}

type InboxProps = {
  messages: Message[],
  post: (message:string, recipient: string) => Promise<void>
  inbox?: Inbox
}
const InboxContext = React.createContext<InboxProps>({
  post: (): Promise<void> => Promise.resolve(undefined), 
  messages: []
});

export function InboxProvider({ children = null as any }) {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const { ready: identityReady, decryptionKey, did} = useIdentity();
  const [inbox, setInbox] = useState<Inbox>();
  const [messages, setMessages] = useState<Message[]>([]);

  const create = useCallback(async () => {
    const createdInbox = await createInbox(connection, wallet)
    console.log("Inbox created");
    return createdInbox;
  }, [connection, wallet]);

  useEffect(() => {
    if (inbox || !wallet || !connected || !identityReady) return;

    console.log("Check exists");
    get(did)
      .then((foundInbox) => foundInbox || create())
      .then(setInbox);
  }, [wallet, connected, inbox, setInbox]);

  useEffect(() => {
    if (!wallet || !connected || !inbox) return;
    console.log("READING!");
    // subscribe to inbox messages
    const subscription = read(did, decryptionKey).subscribe(message => {
      if (message) {
        console.log("Message received", message);
        // add message to local state if not empty
        setMessages(messages => [...messages, message]);
      } else {
        // clear messages when empty message received
        setMessages([]);
      }
    });

    // return unsubscribe method to execute when component unmounts
    // return subscription.unsubscribe;
  }, [wallet, connected, inbox]);
  
  const post = useCallback((message: string, recipient: string) => 
    postToInbox(connection, wallet, did, decryptionKey, recipient, message), 
    [connection, wallet, did, decryptionKey])

  return (
    <InboxContext.Provider value={{
      messages,
      post,
      inbox
    }}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox():InboxProps {
  const context = useContext(InboxContext);
  return {
    messages: context.messages,
    post: context.post,
    inbox: context.inbox
  };
}