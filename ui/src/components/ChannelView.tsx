import Feed from "./Feed";
import Post from "./Post";
import {useChannel} from "../service/channels/channel";

const ChannelView = () => {
  const { messages, post, channel} = useChannel();

  return (
    <div className="grid grid-cols-1 gap-4 lg:col-span-2">
      <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate" id="section-1-title">
        {channel?.name || ''}
      </h2>
      <section aria-labelledby="section-1-title">
        <div className="rounded-lg bg-myrtleGreen overflow-hidden shadow mb-3">
          <div className="p-2">
            <Post post={post} disabled={!channel}/>
          </div>
        </div>
        <div className="rounded-lg bg-myrtleGreen overflow-hidden shadow">
          <div className="p-2">
            <Feed messages={messages}/>
          </div>
        </div>
      </section>
    </div>

  );
}

export default ChannelView
