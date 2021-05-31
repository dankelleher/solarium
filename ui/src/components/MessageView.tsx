import Avatar from "./Avatar";
import {Message} from "solarium-js";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)

const timeAgo = new TimeAgo('en-US')

type Props = { message: Message }

const toDate = (timestamp: number) => timeAgo.format(new Date(timestamp * 1000));

const MessageView = ({message}: Props) => (
    <li key={message.content} className="py-4">
      <div className="flex space-x-3">
        <Avatar address={message.sender}/>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{message.sender}</h3>
            <p className="text-sm text-aeroBlue-light">{toDate(message.timestamp)}</p>
          </div>
          <p className="text-sm text-aeroBlue-light">
            {message.content}
          </p>
        </div>
      </div>
    </li>);

export default MessageView