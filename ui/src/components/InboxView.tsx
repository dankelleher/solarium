import Feed from "./Feed";
import Post from "./Post";
import {useInbox} from "../service/inbox/inbox";

export default () => {
  const { messages, post, inbox } = useInbox();
  const recipient = 'did:sol:devnet:Egv3x852G9BSWSSe6c1aGnVBVrLVHhGKEz7R9pv1ueJr';

  return (
    <div className="grid grid-cols-1 gap-4 lg:col-span-2">
      <section aria-labelledby="section-1-title">
        <h2 className="sr-only" id="section-1-title">
          Section title
        </h2>
        <div className="rounded-lg bg-white overflow-hidden shadow mb-3">
          <div className="p-6">
            <Post post={post} recipient={recipient} disabled={!inbox}/>
          </div>
        </div>
        <div className="rounded-lg bg-white overflow-hidden shadow">
          <div className="p-6">
            <Feed messages={messages}/>
          </div>
        </div>
      </section>
    </div>

  );
}