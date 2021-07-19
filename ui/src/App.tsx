import {Fragment} from 'react'
import {Popover, Transition} from '@headlessui/react'
import {BellIcon, MenuIcon, XIcon} from '@heroicons/react/outline'
import Button from "./components/Button";
import WalletBar from './components/WalletBar'
import {WalletProvider} from "./service/wallet/wallet";
import {ChannelProvider} from "./service/channels/channel";
import ChannelView from "./components/ChannelView";
import logoText from './logo-text.png'
import ChannelList from "./components/ChannelList";
import OnboardingController from "./components/onboarding/OnboardingController";
import Logo from "./components/logo/Logo";
import {IdentityProvider} from "./service/identity";
import {UserMenu} from "./components/userMenu/UserMenu";

export default function App() {
  return (
    <WalletProvider>
      <IdentityProvider>
        <ChannelProvider>
          <OnboardingController/>
          <div className="min-h-screen bg-black font-white">
            <Popover as="header" className="pb-10 bg-black">
              {({ open }) => (
                <>
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                    <div className="relative py-5 flex items-center justify-center lg:justify-between">
                      {/* Logo */}
                      <div className="absolute left-0 flex-shrink-0 lg:static">
                        <a href="#solarium">
                          <span className="sr-only">Solarium</span>
                          <Logo/>
                          <img
                            className="h-20 w-auto py-4 flex-grow inline-block"
                            src={logoText}
                            alt="Solarium"
                          />
                        </a>
                      </div>

                      {/* Right section on desktop */}
                      <div className="hidden lg:ml-4 lg:flex lg:items-center lg:pr-0.5 text-turquoise">
                        <WalletBar/>
                        <Button icon={BellIcon} text="View notifications"/>

                        {/* Profile dropdown */}
                        <UserMenu/>
                      </div>

                      {/* Menu button */}
                      <div className="absolute right-0 flex-shrink-0 lg:hidden">
                        {/* Mobile menu button */}
                        <Popover.Button className="bg-transparent p-2 rounded-md inline-flex items-center justify-center text-aeroBlue-200 hover:text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white">
                          <span className="sr-only">Open main menu</span>
                          {open ? (
                            <XIcon className="block h-6 w-6" aria-hidden="true" />
                          ) : (
                            <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                          )}
                        </Popover.Button>
                      </div>
                    </div>
                  </div>

                  <Transition.Root show={open} as={Fragment}>
                    <div className="lg:hidden">
                      <Transition.Child
                        as={Fragment}
                        enter="duration-150 ease-out"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="duration-150 ease-in"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Popover.Overlay static className="z-20 fixed inset-0 bg-black bg-opacity-25" />
                      </Transition.Child>

                      <Transition.Child
                        as={Fragment}
                        enter="duration-150 ease-out"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="duration-150 ease-in"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Popover.Panel
                          focus
                          static
                          className="z-30 absolute top-0 inset-x-0 max-w-3xl mx-auto w-full p-2 transition transform origin-top"
                        >
                          <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y divide-gray-200">
                            <div className="pt-3 pb-2">
                              <div className="flex items-center justify-between px-4">
                                <div>
                                  <img
                                    className="h-8 w-auto"
                                    src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                                    alt="Workflow"
                                  />
                                </div>
                                <div className="-mr-2">
                                  <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-aeroBlue-500">
                                    <span className="sr-only">Close menu</span>
                                    <XIcon className="h-6 w-6" aria-hidden="true" />
                                  </Popover.Button>
                                </div>
                              </div>
                              <div className="mt-3 px-2 space-y-1">
                                <a
                                  href="#home"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Home
                                </a>
                                <a
                                  href="#profile"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Profile
                                </a>
                                <a
                                  href="#resources"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Resources
                                </a>
                                <a
                                  href="#company-directory"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Company Directory
                                </a>
                                <a
                                  href="#openings"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Openings
                                </a>
                              </div>
                            </div>
                            <div className="pt-4 pb-2">
                              <div className="flex items-center px-5">
                                <div className="flex-shrink-0">
                                </div>
                                <button className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aeroBlue-500">
                                  <span className="sr-only">View notifications</span>
                                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                              </div>
                              <div className="mt-3 px-2 space-y-1">
                                <a
                                  href="#profile"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Your Profile
                                </a>
                                <a
                                  href="#settings"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Settings
                                </a>
                                <a
                                  href="#signout"
                                  className="block rounded-md px-3 py-2 text-base text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-800"
                                >
                                  Sign out
                                </a>
                              </div>
                            </div>
                          </div>
                        </Popover.Panel>
                      </Transition.Child>
                    </div>
                  </Transition.Root>
                </>
              )}
            </Popover>
            <main className="pb-8">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                <h1 className="sr-only">Solarium</h1>
                {/* Main 3 column grid */}
                <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-3 lg:gap-8">
                  {/* Left column */}
                  <ChannelView/>
                  {/* Right column */}
                  <div className="grid grid-cols-1 gap-4">
                    <ChannelList/>
                  </div>
                </div>
              </div>
            </main>
            <footer>
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
                <div className="border-t border-gray-200 py-8 text-sm text-gray-500 text-center sm:text-left">
                  <span className="block sm:inline">&copy; 2021 Daniel Kelleher.</span>{' '}
                  <span className="block sm:inline">All rights reserved.</span>
                </div>
              </div>
            </footer>
          </div>
        </ChannelProvider>
      </IdentityProvider>
    </WalletProvider>
  )
}
