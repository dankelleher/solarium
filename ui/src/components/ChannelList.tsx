import {useChannel} from "../service/channels/channel";
import MessageView from "./MessageView";
import {Channel} from "solarium-js";
import {DirectChannel} from "../service/channels/addressBook";

const ChannelList = () => {
  const { channel, setCurrentChannel, addressBook} = useChannel();

  let groupChannels: Channel[] = [];
  let directChannels: DirectChannel[] = [];

  if (addressBook) {
      groupChannels = addressBook.groupChannels
      directChannels = addressBook.directChannels
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:col-span-2">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate" id="section-1-title">
            Group Channel List
        </h2>
      <section aria-labelledby="section-1-title">
          <div className="flow-root mt-6">
              <ul className="-my-5 divide-y divide-gray-200">
                  {groupChannels.map((ch) =>
                      <li className="py-4" key={ch.address.toBase58()}>
                          <div className="flex items-center space-x-4">
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                      {ch.name}
                                  </p>
                              </div>
                              <div>
                                  <button
                                      onClick={() => setCurrentChannel(ch)}
                                      disabled={ channel && channel.address.toBase58() === ch.address.toBase58() }
                                      className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                      Join
                                  </button>
                              </div>
                          </div>
                      </li>
                  )}
              </ul>
          </div>
      </section>
    </div>

  );
}

export default ChannelList
