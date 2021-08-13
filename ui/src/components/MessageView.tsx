import Avatar from "./Avatar";
import {Message, MessageSender} from "solarium-js";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import {useChannel} from "../service/channels/channel";
import { UserAddIcon, ChatIcon } from '@heroicons/react/outline'
import {useCallback, useState} from "react";
import AddContactModal from "./modal/AddContactModal";

// try-catch improves hot-loading
try { TimeAgo.addDefaultLocale(en) } catch {}

const timeAgo = new TimeAgo('en-US')

type Props = { message: Message }

const toDate = (timestamp: number) => timeAgo.format(new Date(timestamp * 1000));

const MessageView = ({message}: Props) => {
  const { addressBook, channel, setCurrentChannel } = useChannel();
  const getContactChannel = useCallback((did) => addressBook?.getDirectChannelByContactDID(did), [ addressBook ])

  const [ addContactModal, showAddContactModal ] = useState<boolean>(false);
  const [ addContactDID, setAddContactDID ] = useState<string>();
  const addContact = useCallback((contact:MessageSender) => {
    setAddContactDID(contact.did)
    showAddContactModal(true)
  }, [setAddContactDID, showAddContactModal]);

  const chat = useCallback((did: string) => {
    const directChannel = getContactChannel(did);
    if (directChannel) setCurrentChannel(directChannel.channel);
  }, [setCurrentChannel, getContactChannel])

  const getIcon = useCallback(() => {
    const contactChannel = getContactChannel(message.sender)
    const show = !addressBook?.isOwnDid(message.sender.did) && channel && channel.address.toBase58() !== contactChannel?.channel.address.toBase58()

    return show && (!!contactChannel
      ? <ChatIcon className="cursor-pointer block ml-2 h-5 w-5" aria-hidden="true" onClick={() => chat(message.sender.did)}/>
      : <UserAddIcon className="cursor-pointer block ml-2 h-5 w-5" aria-hidden="true" onClick={() => addContact(message.sender)}/>)
  }, [addressBook, channel, chat, addContact, getContactChannel, message])

  return (
    <li className="py-4">
      <div className="flex space-x-3">
        <Avatar address={message.sender.did}/>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            {/* Logo and Identifier */}
            <div className="group flex">
              <h3 className="text-sm font-medium">{addressBook?.getDIDViewName(message.sender) || message.sender}</h3>
              <div className="flex opacity-0 group-hover:opacity-100 text-white">
                { getIcon() }
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex-none">
              <p className="text-sm text-aeroBlue-light">{toDate(message.timestamp)}</p>
            </div>
          </div>
          <p className="text-sm text-aeroBlue-light">
            {message.content}
          </p>
        </div>
      </div>
      <AddContactModal show={addContactModal} setShow={showAddContactModal} prefilledDID={addContactDID}/>
    </li>);
};

export default MessageView
