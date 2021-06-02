import React, { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Wizard from './Wizard'
import {OnboardingStep} from "./OnboardingController";
import Logo from "../Logo";

type Props = {
  title: string,
  steps: OnboardingStep[],
  currentStepIndex: number
  next: () => void
}
export default ({ title, steps, currentStepIndex, next }:Props) => {
  const [open, setOpen] = useState(true)

  const nextRef = useRef(null)

  const nextButtonText = currentStepIndex === steps.length - 1 ? 'Let\'s go!' : 'Next'

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={nextRef}
        open={open}
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 rounded-full bg-myrtleGreen">
                  <Logo/>
                </div>
                <div className="mt-3 text-center sm:mt-5 text-myrtleGreen">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium">
                    {title}
                  </Dialog.Title>
                  <Dialog.Description>
                    Let's get you set up...
                  </Dialog.Description>
                  <div className="mt-2 py-6">
                    <Wizard steps={steps} currentStepIndex={currentStepIndex}/>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 text-center">
                <button
                  type="button"
                  className="w-1/2 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-myrtleGreen text-base font-medium text-aeroBluen hover:bg-myrtleGreen-lightest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-myrtleGreen sm:col-start-2 sm:text-sm"
                  onClick={next}
                  ref={nextRef}
                >
                  {nextButtonText}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
