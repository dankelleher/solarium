import Feed from "./Feed";
import Post from "./Post";
import {useChannel} from "../service/channels/channel";
import {useEffect, useMemo, useState} from "react";
import {ChannelType, DirectChannel, GroupChannel} from "../service/channels/addressBook";
import Avatar from "./Avatar";
import { ClipboardIcon, ClipboardCheckIcon } from '@heroicons/react/outline'

const ChannelView = () => {
  const { messages, post, channel, addressBook} = useChannel();
  const [ channelCopyState, setChannelCopyState ] = useState<boolean>(false)

  const [solariumChannel, setSolariumChannel] = useState<GroupChannel | DirectChannel>()

  useEffect(() => {
    if (channel) setSolariumChannel(addressBook?.findChannel(channel))
  }, [channel, setSolariumChannel, addressBook])

  const copyChannelIcon = useMemo(() => {
    const copyChannelAddress = () => {
      if (!channel) return;
      navigator.clipboard.writeText(channel.address.toBase58())
      setChannelCopyState(true);
      // stop showing the check symbol after 3 seconds
      setTimeout(() => setChannelCopyState(false), 3000)
    };

    if (!channelCopyState) {
      return (
        <ClipboardIcon
          className="opacity-0 group-hover:opacity-100 text-white cursor-pointer block ml-2 mt-2 h-5 w-5"
          aria-hidden="true"
          onClick={copyChannelAddress}/>
      );
    }

    return (
      <ClipboardCheckIcon
        className="opacity-0 group-hover:opacity-100 text-white cursor-pointer block ml-2 mt-2 h-5 w-5"
        aria-hidden="true"
        onClick={copyChannelAddress}/>
    )
  }, [channel, channelCopyState, setChannelCopyState])

  return (
    <div className="grid grid-cols-1 gap-4 lg:col-span-2">
      <div className="group flex items-center space-x-4">
        <div>
          <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate" id="section-1-title">
            {solariumChannel ? addressBook?.getChannelViewName(solariumChannel) : ''}
          </h2>
        </div>
        <div>
          {solariumChannel && solariumChannel.type === ChannelType.Direct && <Avatar address={(solariumChannel as DirectChannel).contact.did}/>}
        </div>
        {copyChannelIcon}
      </div>
      <section aria-labelledby="section-1-title">
        <div className="rounded-lg bg-myrtleGreen-dark overflow-hidden shadow mb-3">
          <div className="p-2">
            <Post post={post} disabled={!channel}/>
          </div>
        </div>
        <div className="rounded-lg bg-myrtleGreen-dark overflow-hidden shadow">
          <div className="p-2">
            <Feed messages={messages}/>
          </div>
        </div>
      </section>
    </div>

  );
}

export default ChannelView
