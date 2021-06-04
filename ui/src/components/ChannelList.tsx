import {useChannel} from "../service/channels/channel";
import {Channel} from "solarium-js";
import {ContactConfig, DirectChannel} from "../service/channels/addressBook";
import {useCallback, useState} from "react";
import AddContactModal from "./AddContactModal";
import Avatar from "./Avatar";
import InviteToGroupChannel from "./InviteToGroupModal";
import CreateChannelModal from "./CreateChannelModal";

const ChannelList = () => {
  const { channel, setCurrentChannel, addressBook} = useChannel();
  const [ addContactModal, showAddContactModal ] = useState<boolean>(false);
  const [ createChannelModal, showCreateChannelModal ] = useState<boolean>(false);


  const [ inviteToGroupModal, showInviteToGroupModal ] = useState<boolean>(false);
  const [ selectedChannelBase58, setSelectedChannelBase58 ] = useState<string>();
  const [ selectedContactDid, setSelectedContactDid ] = useState<string>();


  const showInviteToGroupModalPrefilled = useCallback((channelBase58?: string, contactDid?: string ) => {
    setSelectedChannelBase58(channelBase58)
    setSelectedContactDid(contactDid)
    showInviteToGroupModal(true)
  }, [setSelectedChannelBase58, setSelectedContactDid, showInviteToGroupModal]);

  let groupChannels: Channel[] = [];
  let directChannels: DirectChannel[] = [];

  if (addressBook) {
      groupChannels = addressBook.groupChannels.map(gc => gc.channel)
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
                              <div className="flex items-start space-x-4">
                                  <div>
                                      {channel?.address.toBase58() !== ch.address.toBase58() && <button
                                        onClick={() => setCurrentChannel(ch)}
                                        className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        Join
                                      </button>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <button
                                          onClick={() => showInviteToGroupModalPrefilled(ch.address.toBase58())}
                                          className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                          Invite
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </li>
                  )}
              </ul>
          </div>

      </section>
        <button
            onClick={() => showCreateChannelModal(true)}
            className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Add Channel
        </button>

        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate" id="section-1-title">
            Contacts
        </h2>
        <section aria-labelledby="section-1-title">
            <div className="flow-root mt-6">
                <ul className="-my-5 divide-y divide-gray-200">
                    {directChannels.map((ch) =>
                        <li className="py-4" key={ch.channel.address.toBase58()}>
                            <div className="flex items-center space-x-4">
                                <div className="flex-1 min-w-0">
                                    <Avatar address={ch.contact.did}/>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {ch.contact.alias}
                                    </p>
                                </div>
                              <div className="flex items-start space-x-4">
                                <div>
                                    {channel?.address.toBase58() !== ch.channel.address.toBase58() && <button
                                      onClick={() => setCurrentChannel(ch.channel)}
                                      className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                      Chat
                                    </button>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <button
                                    onClick={() => showInviteToGroupModalPrefilled(undefined, ch.contact.did)}
                                    className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Invite
                                  </button>
                                </div>
                              </div>
                            </div>
                        </li>
                    )}
                </ul>
            </div>
        </section>
        <button
            onClick={() => showAddContactModal(true)}
            className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Add Contact
        </button>
      <button
        onClick={() => showInviteToGroupModalPrefilled()}
        className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Invite
      </button>
      <AddContactModal show={addContactModal} setShow={showAddContactModal}/>
      <CreateChannelModal show={createChannelModal} setShow={showCreateChannelModal}/>

      <InviteToGroupChannel show={inviteToGroupModal}
                              setShow={showInviteToGroupModal}
                              channels={groupChannels}
                              contacts={directChannels.map(x => x.contact)} prefilledChannelBase58={selectedChannelBase58} prefilledContactDid={selectedContactDid}/>
    </div>

  );
}

export default ChannelList
