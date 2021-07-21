import {useIdentity} from "../../service/identity";
import RequestAliasModal from "./RequestAliasModal";

type Props = { show: boolean, setShow: (show: boolean) => void}
const SetAliasModal: React.FC<Props> = ({show, setShow}) => {
  const { setAlias } = useIdentity()
  
  return (
    <RequestAliasModal onOk={setAlias} show={show} setShow={setShow} />
  )
}

export default SetAliasModal;
