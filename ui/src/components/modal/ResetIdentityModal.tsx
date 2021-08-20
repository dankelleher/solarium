import Modal from "./Modal"
import React from "react";
import {ExclamationCircleIcon} from "@heroicons/react/outline";

type Props = { 
  show: boolean,
  setShow: (show: boolean) => void,
  onOk: () => void | Promise<void>
}
const ResetIdentityModal: React.FC<Props> = ({show, setShow, onOk}) => {
  const asyncOK = async () => onOk();
  return (
    <Modal
      title="Reset Identity?"
      description="It looks like you have used Solarium before, but your identity does not match the wallet you have connected. Reset and use the new wallet? WARNING - you will no longer see your old messages or channels."
      show={show} onOK={asyncOK} onClose={() => setShow(false)} renderIcon={() => (<ExclamationCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />)}>
    </Modal>
  )
}

export default ResetIdentityModal;
