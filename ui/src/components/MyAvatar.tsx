import Avatar from "./Avatar";
import {useIdentity} from "../service/identity";

type Props = {
  className?: string
}
const MyAvatar = (props:Props) => {
  const { did } = useIdentity();
  
  return <Avatar {...props} address={did || ''}/>
}

export default MyAvatar