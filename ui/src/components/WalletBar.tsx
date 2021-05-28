import { Popover } from "@headlessui/react";
import React from "react";
import {useWallet} from "../service/wallet/wallet";
import {UserCircleIcon} from "@heroicons/react/outline";
import Button from "./Button";

const WalletBar = () => {
    const { connected, wallet } = useWallet();
    return (
        <>
            {/*<AccountInfo/>*/}
            <div>
                {!connected && (
                    <Button icon={UserCircleIcon} text="User" onClick={connected ? wallet.disconnect : wallet.connect}/>
                )}
                {connected && (
                    <Popover
                        // placement="bottomRight"
                        title="Wallet public key"
                        // trigger="click"
                    ></Popover>
                )}
            </div>
            {
                // <Popover
                //   placement="topRight"
                //   title="Settings"
                //   content={<Settings/>}
                //   trigger="click"
                // >
                //   <Button
                //     shape="circle"
                //     size="large"
                //     type="text"
                //     icon={<SettingOutlined/>}
                //   />
                // </Popover>
            }
        </>
    );
}

export default WalletBar