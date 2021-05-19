import {useState} from "react";
import Avatar from "./Avatar";

type Props = {
  recipient: string,
  post: (message: string, recipient: string) => Promise<void>
  disabled: boolean
}
export default ({recipient, post, disabled}: Props) => {
  const [message, setMessage] = useState<string>();
  return (
    <div>
      <div className="flex space-x-3">
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <form onSubmit={(event) => {
              event.preventDefault() 
              message && post(message, recipient)
            }}>
              <label htmlFor="message" className="sr-only">
                Message
              </label>
              <input
                type="text"
                name="message"
                id="message"
                className="disabled:opacity-50 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="message"
                onChange={event => setMessage(event.target.value)}
                disabled={disabled}
              />
            </form>
          </div>
        </div>
        <Avatar address={recipient}/>
      </div>
    </div>
  )
}
