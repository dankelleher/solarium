import {useInbox} from "../service/inbox/inbox";
import MessageView from "./MessageView";
import {useEffect} from "react";

export default function Feed() {
  const { messages } = useInbox();
  
  return (
    <div>
      <ul className="divide-y divide-gray-200">
        {messages.map((message) => <MessageView message={message}/>)}
      </ul>
    </div>
  )
}
