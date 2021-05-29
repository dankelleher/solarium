import React, {useCallback, useContext, useEffect, useState} from "react";
import {useWallet} from "../wallet/wallet";
import {Message, Channel} from "solarium-js";
import {useConnection} from "../web3/connection";
import {useIdentity} from "../identity";
import {postToChannel, readChannel} from "./solarium";
import {useLocalStorageState} from "../storage";
import {
  AddressBookConfig,
  AddressBookManager,
  emptyAddressBookConfig, isGroupChannel,
  publicChannelConfigByName
} from "./addressBook";
import {DEFAULT_CHANNEL} from "../constants";

type ChannelProps = {
  messages: Message[],
  post: (message: string) => Promise<void>,
  channel?: Channel
  setCurrentChannel: (channel: Channel) => void
  addressBook: AddressBookManager | undefined
}

const ChannelContext = React.createContext<ChannelProps>({
  post: (): Promise<void> => Promise.resolve(undefined),
  messages: [],
  setCurrentChannel: () => {},
  addressBook: undefined
});
export function ChannelProvider({ children = null as any }) {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const { ready: identityReady, decryptionKey, did} = useIdentity();
  const [channel, setChannel] = useState<Channel>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [addressBook, setAddressBook] = useState<AddressBookManager>();
  const [currentChannelInState, setCurrentChannelInState] = useLocalStorageState<string>('channel');
  const [addressBookStore, setAddressBookStore] = useLocalStorageState<AddressBookConfig>('addressBook', emptyAddressBookConfig);

  // const loadChannel = useCallback(async (channelAddress: PublicKey) => {
  //   if (!wallet || !connected || !identityReady) return;
  //   const loadedChannel = await getChannel(connection, wallet, did, channelAddress.toBase58(), decryptionKey)
  //   if (!loadedChannel) throw new Error('Could not find channel ' + channelAddress.toBase58())
  //   setChannel(loadedChannel)
  // }, [setChannel, wallet, connected, connection, identityReady, did, decryptionKey])
  //
  // const setCurrentChannel = async (channelAddress: PublicKey) => {
  //   setCurrentChannelInState(channelAddress.toBase58())
  //   await loadChannel(channelAddress);
  // }

  const setCurrentChannel = useCallback(async (newChannel: Channel | undefined) => {
    if (!newChannel) return;
    setCurrentChannelInState(newChannel.address.toBase58());
    setChannel(newChannel)
  }, [setChannel, setCurrentChannelInState]);

  const joinLobby = useCallback(() => {
    if (!addressBook?.getChannelByName(DEFAULT_CHANNEL)) {
      // not in lobby- try to join it.
      const lobbyConfig = publicChannelConfigByName(DEFAULT_CHANNEL);

      if (!lobbyConfig) {
        throw new Error(`No channel named ${DEFAULT_CHANNEL} found in config`)
      }

      return addressBook?.joinChannel(lobbyConfig)
    } // else already in the lobby
  },  [addressBook])

  useEffect(() => {
    if (!wallet || !connected || !identityReady) return;

    AddressBookManager.load(addressBookStore, connection, wallet, did, decryptionKey)
      .then(setAddressBook)
      .then(joinLobby)
      .then(() => {
        if (!currentChannelInState && addressBook) {
          return setCurrentChannel(addressBook.getChannelByName(DEFAULT_CHANNEL));
        }
      });
  }, [
    wallet, connected, connection, 
    addressBook, addressBookStore,
    identityReady, did, decryptionKey,
    currentChannelInState, joinLobby, setCurrentChannel
  ]);

  useEffect(() => {
    if (channel || !wallet || !connected || !identityReady || !addressBook) return;

    if (currentChannelInState) {
      const groupOrDirectChannel = addressBook.getGroupOrDirectChannelByAddress(currentChannelInState);
      
      if (groupOrDirectChannel) {
        if (isGroupChannel(groupOrDirectChannel)) {
          setChannel(groupOrDirectChannel);
        } else {
          setChannel(groupOrDirectChannel.channel);
        }
      }
    }
  }, [wallet, connected, addressBook, channel, setChannel, currentChannelInState, identityReady]);

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
    return subscription.unsubscribe;
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
      setCurrentChannel,
      addressBook
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
    setCurrentChannel: context.setCurrentChannel,
    addressBook: context.addressBook
  };
}