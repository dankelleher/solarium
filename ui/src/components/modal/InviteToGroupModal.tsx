import Modal from "./Modal"
import React, {useCallback, useEffect, useState} from "react";
import {useChannel} from "../../service/channels/channel";
import {Channel} from "solarium-js";
import {ContactConfig} from "../../service/channels/addressBook";
import {MailIcon} from "@heroicons/react/outline";

type Props = {
  show: boolean,
  setShow: (show: boolean) => void,
  channels: Channel[],
  contacts: ContactConfig[],
  prefilledChannelBase58?: string,
  prefilledContactDid?: string
}

const InviteToGroupModal: React.FC<Props> = ({
                                            show,
                                            setShow,
                                            channels,
                                            contacts,
                                            prefilledChannelBase58,
                                            prefilledContactDid
                                          }) => {
  const {addressBook} = useChannel();
  const [channelToInvite, setChannelToInvite] = useState<string>();
  const [contactToInvite, setContactToInvite] = useState<string>();

  useEffect(() => {
    // default to first item in list
    if (channels.length > 0) setChannelToInvite(channels[0].address.toBase58())
    if (contacts.length > 0) setContactToInvite(contacts[0].did)

    // default to prefilled
    if (prefilledChannelBase58) setChannelToInvite(prefilledChannelBase58)
    if (prefilledContactDid) setContactToInvite(prefilledContactDid)
  }, [setChannelToInvite, setContactToInvite, prefilledChannelBase58, prefilledContactDid, channels, contacts])

  const inviteToChannel = useCallback(async () => {
    if (!channelToInvite || !contactToInvite) return;

    console.log(`Inviting Channel: ${channelToInvite} and Contact: ${contactToInvite}`)
    await addressBook?.inviteToChannel(channelToInvite, contactToInvite)
  }, [addressBook, channelToInvite, contactToInvite])

  return (
    <Modal title="Invite to Channel" description="" show={show} onOK={inviteToChannel}
           onClose={() => setShow(false)}
           renderIcon={() => (<MailIcon className="h-6 w-6 text-green-600" aria-hidden="true" />)}>
      <div className="flex space-x-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="">
              <h3 className="font-bold leading-7 text-gray-900 sm:text-xl sm:truncate">
                Channel:
              </h3>
            </div>
            <div className="w-2/3">
              <select disabled={!!prefilledChannelBase58}
                      value={channelToInvite}
                      onChange={e => setChannelToInvite(e.target.value)}
                      className="w-full border border-gray-300 rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-gray-400 focus:outline-none appearance-none">
                {channels.map((ch) =>
                  <option
                    key={ch.address.toBase58()}
                    value={ch.address.toBase58()}>{ch.name}</option>
                )}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="">
              <h3 className="font-bold leading-7 text-gray-900 sm:text-xl sm:truncate">
                Contact:
              </h3>
            </div>
            <div className="w-2/3">
              <select disabled={!!prefilledContactDid}
                      value={contactToInvite}
                      onChange={e => setContactToInvite(e.target.value)}
                className="w-full border border-gray-300 rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-gray-400 focus:outline-none appearance-none">
                {contacts.map((c) =>
                  <option
                    key={c.did}
                    value={c.did}>{c.alias}</option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default InviteToGroupModal;
