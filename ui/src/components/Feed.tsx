import MessageView from "./MessageView";
import {Message} from "solarium-js";

type Props = { messages: Message[] }
export default ({messages}: Props) => <div>
  <ul className="divide-y divide-gray-200">
    {messages.map((message) => <MessageView message={message}/>)}
  </ul>
</div>
