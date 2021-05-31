import Feed from "./Feed";
import Post from "./Post";
import {useChannel} from "../service/channels/channel";

const ChannelView = () => {
  const { messages, post, channel} = useChannel();
  
  return (
    <div className="grid grid-cols-1 gap-4 lg:col-span-2">
      <section aria-labelledby="section-1-title">
        <h2 className="sr-only" id="section-1-title">
          {channel?.name || ''}
        </h2>
        <div className="rounded-lg bg-myrtleGreen-darkest overflow-hidden shadow mb-3">
          <div className="p-2">
            <Post post={post} disabled={!channel}/>
          </div>
        </div>
        <div className="rounded-lg bg-myrtleGreen-darkest overflow-hidden shadow">
          <div className="p-2">
            <Feed messages={messages}/>
          </div>
        </div>
      </section>
    </div>

  );
}

export default ChannelView
