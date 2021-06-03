import Avatar from "./Avatar";
import {Message} from "solarium-js";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import {useChannel} from "../service/channels/channel";
import { ClipboardIcon, UserAddIcon, ChatIcon } from '@heroicons/react/outline'
import {useCallback, useState} from "react";
import AddContactModal from "./AddContactModal";

// try-catch improves hot-loading
try { TimeAgo.addDefaultLocale(en) } catch {}

const timeAgo = new TimeAgo('en-US')

type Props = { message: Message }

const toDate = (timestamp: number) => timeAgo.format(new Date(timestamp * 1000));

const MessageView = ({message}: Props) => {
  const { addressBook} = useChannel();
  const isContact = useCallback((did) => !!addressBook?.getDirectChannelByContactDID(did), [ addressBook ])
  const [ addContactModal, showAddContactModal ] = useState<boolean>(false);
  
  
  return (
    <li key={message.content} className="py-4">
      <div className="flex space-x-3">
        <Avatar address={message.sender}/>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="group flex">
              <h3 className="text-sm font-medium">{addressBook?.getDIDViewName(message.sender) || message.sender}</h3>
              <div className="flex opacity-0 group-hover:opacity-100 text-white">
                { isContact(message.sender) 
                  ? <ChatIcon className="block ml-2 h-5 w-5" aria-hidden="true"/>
                  : <UserAddIcon className="block ml-2 h-5 w-5" aria-hidden="true" onClick={() => showAddContactModal(true)}/> }
              </div>
              
            </div>
            <p className="text-sm text-aeroBlue-light">{toDate(message.timestamp)}</p>
          </div>
          <p className="text-sm text-aeroBlue-light">
            {message.content}
          </p>
        </div>
      </div>
      <AddContactModal show={addContactModal} setShow={showAddContactModal}/>
    </li>);
};

export default MessageView