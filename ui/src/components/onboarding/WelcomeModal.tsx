import React, { Fragment, useRef, useState } from 'react'
import {Dialog, Transition} from "@headlessui/react";
import Logo from "../logo/Logo";


type Props = {
  show: boolean,
  setShow: (show: boolean) => void,
}

const WelcomeModal: React.FC<Props> = ({
                                               show,
                                               setShow,
                                             }) => {


  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-20 inset-0 overflow-y-auto"
        open={show}
        onClose={() => {}}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 rounded-full bg-myrtleGreen">
                  <Logo/>
                </div>
                <div className="mt-3 text-center sm:mt-5 text-myrtleGreen">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium">
                    Welcome to SOLARIUM
                  </Dialog.Title>

                  <div className="p-6 text-left">
                    <div className="flow-root mt-1">
                      <p className="mt-1 line-clamp-2">
                        Solarium is a fully decentralised, end-to-end encrypted, censorship-resistant instant messenger based on the <a className="font-bold" href="https://solana.com" rel="nofollow" target="_blank">Solana</a> blockchain.
                      </p>
                      <p className="mt-1 line-clamp-2">
                        Visit our <a className="font-bold" href="https://github.com/dankelleher/solarium" rel="nofollow" target="_blank">Github Page</a> to find out more about the project!
                      </p>
                    </div>
                    <div className="flow-root mt-3">
                      <h3 className="text-lg leading-6 font-medium">
                        A Solarium primer video
                      </h3>
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe src="https://www.youtube.com/embed/C_XVl1fT76Y" frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen></iframe>
                      </div>
                    </div>

                    <div className="flow-root mt-3">
                      <h3 className="text-lg leading-6 font-medium">
                        The technology behind solarium
                      </h3>
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe src="https://www.youtube.com/embed/kgDRefJECIE" frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen></iframe>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="mt-5 sm:mt-6 text-center">
                <button
                  type="button"
                  className="w-1/2 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-myrtleGreen text-base font-medium text-aeroBluen hover:bg-myrtleGreen-lightest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-myrtleGreen sm:col-start-2 sm:text-sm"
                  onClick={() => setShow(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )

}

export default WelcomeModal
