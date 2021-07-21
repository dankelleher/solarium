import Modal from "./Modal"
import React, {useCallback, useState} from "react";
import {UserAddIcon} from "@heroicons/react/outline";

type Props = { show: boolean, setShow: (show: boolean) => void, onOk: (alias: string) => void | Promise<void>}
const RequestAliasModal: React.FC<Props> = ({show, setShow, onOk}) => {
  const [ aliasValue, setAliasValue ] = useState<string>()

  const setAliasForDID = useCallback(async () => aliasValue? onOk(aliasValue) : Promise.resolve(),
   [aliasValue, onOk])

  return (
    <Modal title="Set Alias" description="Set your global alias" show={show} onOK={setAliasForDID} onClose={() => setShow(false)} renderIcon={() => (<UserAddIcon className="h-6 w-6 text-green-600" aria-hidden="true" />)}>
      <label htmlFor="alias" className="sr-only">
        Alias
      </label>
      <input
        type="text"
        name="alias"
        id="alias"
        className="text-myrtleGreen disabled:opacity-50 shadow-sm focus:ring-aeroBlue-500 focus:border-aeroBlue-500 block w-full sm:text-sm border-gray-300 rounded-md"
        placeholder="alias"
        value={aliasValue}
        onChange={event => setAliasValue(event.target.value)}
      />
    </Modal>
  )
}

export default RequestAliasModal;
