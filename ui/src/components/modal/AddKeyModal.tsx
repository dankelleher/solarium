import Modal from "./Modal"
import React from "react";
import {ExclamationCircleIcon} from "@heroicons/react/outline";

type Props = { 
  show: boolean,
  setShow: (show: boolean) => void,
  onOk: () => void | Promise<void>
}
const AddKeyModal: React.FC<Props> = ({show, setShow, onOk}) => {
  const asyncOK = async () => onOk();
  return (
    <Modal
      title="Add Key?"
      description="It looks like you have used Solarium before on a different browser. Do you want to add this browser to your identity?"
      show={show} onOK={asyncOK} onClose={() => setShow(false)} renderIcon={() => (<ExclamationCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />)}>
    </Modal>
  )
}

export default AddKeyModal;
