import Modal from "./Modal"
import {useCallback, useEffect, useState} from "react";
import {useChannel} from "../service/channels/channel";

type Props = { show: boolean, setShow: (show: boolean) => void, prefilledDID?: string }
const AddContactModal: React.FC<Props> = ({show, setShow, prefilledDID}) => {
  const { setCurrentChannel, addressBook} = useChannel();
  const [didToInvite, setDidToInvite] = useState<string>();
  const [aliasToInvite, setAliasToInvite] = useState<string>()

  useEffect(() => {
    if (prefilledDID) setDidToInvite(prefilledDID)
  }, [setDidToInvite, prefilledDID, didToInvite])

  const addContact = useCallback(async () => {
    if (!didToInvite || !aliasToInvite) return;
    addressBook?.addContact(didToInvite, aliasToInvite).then(  // TODO
      directChannel => setCurrentChannel(directChannel.channel)
    )
  }, [addressBook, didToInvite, aliasToInvite, setCurrentChannel])

  return (
    <Modal title="Add Contact" description="" show={show} onOK={addContact} onClose={() => setShow(false)}>
      <label htmlFor="did" className="sr-only">
        DID
      </label>
      <input
        type="text"
        name="did"
        id="did"
        className="text-myrtleGreen disabled:opacity-50 shadow-sm focus:ring-aeroBlue-500 focus:border-aeroBlue-500 block w-full sm:text-sm border-gray-300 rounded-md"
        placeholder="did"
        value={didToInvite}
        onChange={event => setDidToInvite(event.target.value)}
      />
      <label htmlFor="alias" className="sr-only">
        Alias
      </label>
      <input
        type="text"
        name="alias"
        id="alias"
        className="text-myrtleGreen disabled:opacity-50 shadow-sm focus:ring-aeroBlue-500 focus:border-aeroBlue-500 block w-full sm:text-sm border-gray-300 rounded-md"
        placeholder="alias"
        onChange={event => setAliasToInvite(event.target.value)}
      />
    </Modal>
  )
}

export default AddContactModal;
