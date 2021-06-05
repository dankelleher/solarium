import Feed from "./Feed";
import Post from "./Post";
import {useChannel} from "../service/channels/channel";
import {useEffect, useState} from "react";
import {ChannelType, DirectChannel, GroupChannel} from "../service/channels/addressBook";
import Avatar from "./Avatar";
import {Dir} from "fs";

const ChannelView = () => {
  const { messages, post, channel, addressBook} = useChannel();

  const [solariumChannel, setSolariumChannel] = useState<GroupChannel | DirectChannel>()

  useEffect(() => {
    if (channel) setSolariumChannel(addressBook?.findChannel(channel))
  }, [channel, setSolariumChannel, addressBook])

  return (
    <div className="grid grid-cols-1 gap-4 lg:col-span-2">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate" id="section-1-title">
            {solariumChannel ? addressBook?.getChannelViewName(solariumChannel) : ''}
          </h2>
        </div>
        <div>
          {solariumChannel && solariumChannel.type === ChannelType.Direct && <Avatar address={(solariumChannel as DirectChannel).contact.did}/>}
        </div>
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
