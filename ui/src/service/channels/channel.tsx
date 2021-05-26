import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {useLocalStorageKey, useLocalStorageState} from "../storage";
import {useWallet} from "../wallet/wallet";
import {Keypair} from "@solana/web3.js";
import {keyToIdentifier, Message, Channel} from "solarium-js";
import {useConnection} from "../web3/connection";
import {useIdentity} from "../identity";
import {postToChannel, readChannel} from "./solarium";

type ChannelProps = {
  messages: Message[],
  post: (message:string) => Promise<void>,
  channel?: Channel
}
const ChannelContext = React.createContext<ChannelProps>({
  post: (): Promise<void> => Promise.resolve(undefined),
  messages: [],
});

export function ChannelProvider({ children = null as any }) {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const { ready: identityReady, decryptionKey, did} = useIdentity();
  const [channel, setChannel] = useState<Channel>();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (channel || !wallet || !connected || !identityReady) return;

    // console.log("Check exists");
    // get(did)
    //   .then((foundChannel) => foundChannel || create())
    //   .then(setChannel);
  }, [wallet, connected, channel, setChannel]);

  useEffect(() => {
    if (!wallet || !connected || !channel) return;
    console.log("READING!");
    // subscribe to channel messages
    const subscription = readChannel(did, channel, decryptionKey).subscribe(message => {
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
  }, [wallet, connected, channel]);

  const post = useCallback((message: string) => {
      if (!wallet || !connected || !channel) throw new Error("Posting unavailable.");
      return postToChannel(connection, wallet, channel, did, decryptionKey, message);
    },
    [connection, wallet, did, decryptionKey, channel])

  return (
    <ChannelContext.Provider value={{
      messages,
      post,
    }}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel():ChannelProps {
  const context = useContext(ChannelContext);
  return {
    messages: context.messages,
    post: context.post,
    channel: context.channel
  };
}