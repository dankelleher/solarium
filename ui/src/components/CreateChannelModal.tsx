import Modal from "./Modal"
import {useCallback, useEffect, useState} from "react";
import {useChannel} from "../service/channels/channel";
import {ChatIcon, PlusCircleIcon, UserAddIcon} from "@heroicons/react/outline";

type Props = { show: boolean, setShow: (show: boolean) => void }
const CreateChannelModal: React.FC<Props> = ({show, setShow}) => {
  const { setCurrentChannel, addressBook} = useChannel();
  const [newChannelName, setNewChannelName] = useState<string>();

  const createNewChannel = useCallback(async () => {
    // TODO: Check for existing channel with conflicitng name?
    if (!newChannelName) return;
    addressBook?.createChannel(newChannelName).then(
      channel => setCurrentChannel(channel)
    )
  }, [addressBook, newChannelName])

  return (
    <Modal title="Create Channel" description="" show={show} onOK={createNewChannel} onClose={() => setShow(false)} renderIcon={() => (<PlusCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />)}>
      <label htmlFor="channel-name" className="sr-only">
        Channel
      </label>
      <input
        type="text"
        name="channel-name"
        id="channel-name"
        className="text-myrtleGreen disabled:opacity-50 shadow-sm focus:ring-aeroBlue-500 focus:border-aeroBlue-500 block w-full sm:text-sm border-gray-300 rounded-md"
        placeholder="Channel Name"
        value={newChannelName}
        onChange={event => setNewChannelName(event.target.value)}
      />
    </Modal>
  )
}

export default CreateChannelModal;
