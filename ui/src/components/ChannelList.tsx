import {useChannel} from "../service/channels/channel";
import {Channel} from "solarium-js";
import {ChannelType, DirectChannel, GroupChannel} from "../service/channels/addressBook";
import {useCallback, useState} from "react";
import AddContactModal from "./modal/AddContactModal";
import Avatar from "./Avatar";
import InviteToGroupChannel from "./modal/InviteToGroupModal";
import CreateChannelModal from "./modal/CreateChannelModal";
import {ChatIcon, MailIcon, PlusCircleIcon, UserAddIcon} from "@heroicons/react/outline";

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

  const showInviteIcon = useCallback((ch: Channel ) => {
    const groupChannel = addressBook?.findChannel(ch)
    return groupChannel && groupChannel.type == ChannelType.Group && !(groupChannel as GroupChannel).inviteAuthority
  }, [addressBook]);


    let groupChannels: Channel[] = [];
  let directChannels: DirectChannel[] = [];

  if (addressBook) {
      groupChannels = addressBook.groupChannels.map(gc => gc.channel)
      directChannels = addressBook.directChannels
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:col-span-2">
      <div className="flex items-center space-x-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate" id="section-1-title">
              Group Channel List
          </h2>
        </div>
        <div>
          <PlusCircleIcon
            className="cursor-pointer h-8 w-8"
            onClick={() => showCreateChannelModal(true)} />
        </div>
      </div>
      <section aria-labelledby="section-1-title">
        <div className="rounded-lg bg-myrtleGreen-dark overflow-hidden shadow">
          <div className="p-2">
              <ul className="divide-y divide-gray-200 overflow-scroll h-1/2 max-h-96">
                  {groupChannels.map((ch) =>
                      <li className="py-1" key={ch.address.toBase58()}>
                          <div className="flex items-center">
                              <div className="min-w-0">
                                  <p className="text-sm text-aeroBlue-light">
                                      {ch.name}
                                  </p>
                              </div>
                            <div className="flex-1 min-w-0">
                              {showInviteIcon(ch) && <MailIcon className="cursor-pointer block ml-2 h-5 w-5" onClick={() => showInviteToGroupModalPrefilled(ch.address.toBase58())} />}
                            </div>
                              <div className="flex items-center">
                                <div>
                                  {channel?.address.toBase58() !== ch.address.toBase58() &&
                                  <ChatIcon className="cursor-pointer block ml-2 h-5 w-5" onClick={() => setCurrentChannel(ch)} />}
                                </div>
                              </div>
                          </div>
                      </li>
                  )}
              </ul>
          </div>
        </div>
      </section>

      <div className="flex items-center space-x-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate" id="section-1-title">
            Contacts
          </h2>
        </div>
        <div>
          <UserAddIcon
            className="cursor-pointer h-8 w-8"
            onClick={() => showAddContactModal(true)} />
        </div>
      </div>
        <section aria-labelledby="section-1-title">
          <div className="rounded-lg bg-myrtleGreen-dark overflow-hidden shadow">
            <div className="p-2">
              <ul className="divide-y divide-gray-200 overflow-scroll h-1/2 max-h-96">
                    {directChannels.map((ch) =>
                        <li className="py-1" key={ch.channel.address.toBase58()}>
                            <div className="flex items-center space-x-4">
                              <div>
                                <Avatar address={ch.contact.did}/>
                              </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-aeroBlue-light">
                                        {ch.contact.alias}
                                  </p>
                                </div>
                              <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    {channel?.address.toBase58() !== ch.channel.address.toBase58() &&
                                    <ChatIcon className="cursor-pointer block ml-2 h-5 w-5" onClick={() => setCurrentChannel(ch.channel)} />}
                                </div>
                                {/*<div>*/}
                                {/*  <MailIcon className="cursor-pointer block ml-2 h-5 w-5" onClick={() => showInviteToGroupModalPrefilled(undefined, ch.contact.did)} />*/}
                                {/*</div>*/}
                              </div>
                            </div>
                        </li>
                    )}
                </ul>
            </div>
          </div>
        </section>
      {/*<button*/}
      {/*  onClick={() => showInviteToGroupModalPrefilled()}*/}
      {/*  className="inline-flex bg-myrtleGreen items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">*/}
      {/*  Invite*/}
      {/*</button>*/}
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
