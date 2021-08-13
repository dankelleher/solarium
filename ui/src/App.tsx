import {BellIcon} from '@heroicons/react/outline'
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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <div className="relative py-5 flex items-center justify-between">
                {/* Logo */}
                <div className="absolute left-0 flex-shrink-0 sm:static lg:static">
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
                <div className="hidden ml-4 sm:flex lg:flex items-center pr-0.5 text-turquoise">
                  <WalletBar/>
                  <Button icon={BellIcon} text="View notifications"/>

                  {/* Profile dropdown */}
                  <UserMenu/>
                </div>

              </div>
            </div>

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
