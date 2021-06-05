import {useState} from "react";

type Props = {
  post: (message: string) => Promise<void>
  disabled: boolean
}

const MESSAGE_LIMIT = 120

const Post = ({post, disabled}: Props) => {
  const [message, setMessage] = useState<string>();
  return (
    <div className="flex space-x-3">
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <form className="w-full" onSubmit={(event) => {
              event.preventDefault()
              message && post(message)
            }}>
              <label htmlFor="message" className="sr-only">
                Message
              </label>
              <input
                type="text"
                name="message"
                id="message"
                className="bg-myrtleGreen border-0 rounded w-full py-2 px-4 text-aeroBlue-light placeholder-aeroBlue-dark leading-tight focus:outline-none focus:border-aeroBlue"
                maxLength={MESSAGE_LIMIT}
                placeholder="What's going on?"
                onChange={event => setMessage(event.target.value)}
                disabled={disabled}
              />
            </form>
          </div>
        </div>
        <div className="flex items-center flex-row-reverse">
          <div className="">
            <p>{'' + (message ? message.length : '0') + '/' + MESSAGE_LIMIT }</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Post
