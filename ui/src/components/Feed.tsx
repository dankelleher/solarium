import MessageView from "./MessageView";
import {Message} from "solarium-js";
import {useEffect, useRef} from "react";

type Props = { messages: Message[] }

const Feed = ({messages}: Props) => {
  const messageEl = useRef(null);
  useEffect(() => {
    if (messageEl && messageEl.current) {
      // @ts-ignore
      messageEl.current.addEventListener('DOMNodeInserted', event => {
        const { currentTarget: target } = event;
        target.scroll({ top: target.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [])

  return (
    <ul className="divide-y divide-gray-200 overflow-scroll h-1/2 max-h-96" ref={messageEl}>
      {messages.map((message) => <MessageView message={message}/>)}
    </ul>);
}

export default Feed
