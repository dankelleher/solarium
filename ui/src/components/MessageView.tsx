import Avatar from "./Avatar";
import {Message} from "solarium-js";

type Props = { message: Message }

const MessageView = ({message}: Props) => (
    <li key={message.content} className="py-4">
      <div className="flex space-x-3">
        <Avatar address={message.sender}/>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{message.sender}</h3>
            <p className="text-sm text-gray-500">TODO Timestamp</p>
          </div>
          <p className="text-sm text-gray-500">
            {message.content}
          </p>
        </div>
      </div>
    </li>);

export default MessageView