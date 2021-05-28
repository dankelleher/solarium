import React, {useCallback, useContext, useEffect, useState} from "react";
import {useWallet} from "../wallet/wallet";
import {PublicKey} from "@solana/web3.js";
import {Message, Channel} from "solarium-js";
import {useConnection} from "../web3/connection";
import {useIdentity} from "../identity";
import {postToChannel, readChannel, getChannel} from "./solarium";
import {useLocalStorageState} from "../storage";

type ChannelProps = {
  messages: Message[],
  post: (message: string) => Promise<void>,
  channel?: Channel
  setCurrentChannel: (channelAddress: PublicKey) => void
}

const ChannelContext = React.createContext<ChannelProps>({
  post: (): Promise<void> => Promise.resolve(undefined),
  messages: [],
  setCurrentChannel: (channelAddress: PublicKey) => {}
});
export function ChannelProvider({ children = null as any }) {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const { ready: identityReady, decryptionKey, did} = useIdentity();
  const [channel, setChannel] = useState<Channel>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChannelInState, setCurrentChannelInState] = useLocalStorageState<string>('channel');

  const loadChannel = async (channelAddress: PublicKey) => {
    if (!wallet || !connected || !identityReady) return;
    const channel = await getChannel(connection, wallet, channelAddress.toBase58())
    if (!channel) throw new Error('Could not find channel ' + channelAddress.toBase58())
    setChannel(channel)
  }

  const setCurrentChannel = async (channelAddress: PublicKey) => {
    setCurrentChannelInState(channelAddress.toBase58())
    await loadChannel(channelAddress);
  }

  useEffect(() => {

    if (channel || !wallet || !connected || !identityReady) return;
    
    if (currentChannelInState) {
      loadChannel(new PublicKey(currentChannelInState));
    }

    // console.log("Check exists");
    // get(did)
    //   .then((foundChannel) => foundChannel || create())
    //   .then(setChannel);
  }, [wallet, connected, channel, setChannel, currentChannelInState, identityReady]);

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
  }, [wallet, connected, channel, did, decryptionKey]);

  const post = useCallback((message: string) => {
      if (!wallet || !connected || !channel) throw new Error("Posting unavailable.");
      return postToChannel(connection, wallet, channel, did, decryptionKey, message);
    },
    [connection, wallet, did, decryptionKey, channel, connected])

  return (
    <ChannelContext.Provider value={{
      messages,
      post,
      setCurrentChannel
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
    channel: context.channel,
    setCurrentChannel: context.setCurrentChannel
  };
}