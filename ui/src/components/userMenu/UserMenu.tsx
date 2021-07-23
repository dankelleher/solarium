import {Menu, Transition} from "@headlessui/react";
import {classNames} from "../util";
import {useIdentity} from "../../service/identity";
import {Fragment, useState} from "react";
import MyAvatar from "../MyAvatar";
import SetAliasModal from "../modal/SetAliasModal";

const CopyIdentityMenuItem = (props: { className: string }) => {
  const {did} = useIdentity()
  // eslint-disable-next-line jsx-a11y/anchor-is-valid
  return (<a href="#" {...props} onClick={
    () => navigator.clipboard.writeText(did || '')
  }
  >
    Copy Identity
  </a>);
}

const menuClasses = (active: boolean) => classNames(
  'block px-4 py-2 text-sm',
  active ? 'bg-gray-100 text-myrtleGreen' : 'text-aeroBlue-light'
);

export const UserMenu = () => {
    const [setAliasModal, showSetAliasModal] = useState<boolean>(false);

    return <>
      <SetAliasModal show={setAliasModal} setShow={showSetAliasModal}/>
      <Menu as="div" className="ml-4 relative flex-shrink-0">
        {({open}) => (
          <>
            <div>
              <Menu.Button
                className="bg-white rounded-full flex text-sm ring-2 ring-white text-white ring-opacity-20 focus:outline-none focus:ring-opacity-100">
                <span className="sr-only">Open user menu</span>
                <MyAvatar className="h-8 w-8"/>
              </Menu.Button>
            </div>
            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                static
                className="origin-top-right z-40 absolute -right-2 mt-2 w-48 rounded-md shadow-lg py-1 bg-myrtleGreen ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <Menu.Item>
                  {({active}) => (
                    <div className={menuClasses(active)}>
                      <a href="#set-alias" onClick={() => showSetAliasModal(true)}>
                        Set Alias
                        <span
                          className="inline-flex items-center self-end ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-800 text-white">
                        New!
                    </span>
                      </a>

                    </div>
                  )
                  }
                </Menu.Item>
                <Menu.Item>
                  {({active}) =>
                    <CopyIdentityMenuItem className={menuClasses(active)}/>}
                </Menu.Item>
                <Menu.Item>
                  {({active}) => (
                    <a href="#settings" className={menuClasses(active)}>
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({active}) => (
                    <a href="#signout" className={menuClasses(active)}>
                      Sign out
                    </a>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </>)}
      </Menu>
      <span
        className="inline-flex items-center self-end -mt-8 ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-800 text-white">
        New!
      </span>
    </>
  }
;