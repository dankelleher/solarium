import md5 from "md5";
import Gravatar from "react-gravatar";

type Props = {
  address: string
  className?: string
}

const Avatar = ({address, className = "h-6 w-6"}:Props) => <Gravatar className={`${className} rounded-full`} md5={md5(address)}/>

export default Avatar