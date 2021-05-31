import OnboardingModal from "./OnboardingModal";
import {useCallback, useEffect, useState} from "react";
import {useChannel} from "../../service/channels/channel";
import {useWallet} from "../../service/wallet/wallet";
import {useConnection} from "../../service/web3/connection";
import {useIdentity} from "../../service/identity";
import Loader from "../Loader";

const firstTimeSteps: OnboardingStep[] = [
  { name: 'Connect Wallet', description: 'You\'ll use this to send messages', href: '#' },
  {
    name: 'Create Identity',
    description: 'This is how you tell others who you are. Don\'t worry, it\'s anonymous!',
    href: '#'
  },
  { name: 'Add Browser Key', description: 'Messages you send will be encrypted with this.', href: '#' },
  { name: 'Join the Public Lobby', description: 'Say hello!', href: '#' },
  { name: 'Done!', description: '', href: '#' },
]

const returnUserSteps: OnboardingStep[] = [
  { name: 'Connect Wallet', description: 'Reconnect your wallet to see your latest messages', href: '#' },
  { name: 'Done!', description: '', href: '#' },
]

const titleNewUser = "Welcome to Solarium!";
const titleReturnUser = "Welcome back to Solarium!";

export type OnboardingStep = {
  name: string,
  description: string,
  href: string,
}

const OnboardingController = () => {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const { ready: identityReady, decryptionKey, did} = useIdentity();
  const {} = useChannel()
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [title, setTitle] = useState<string>(titleNewUser)

  useEffect(() => {
    const isNewUser = !did;

    const steps = isNewUser ? firstTimeSteps : returnUserSteps;
    
    setTitle(isNewUser ? titleNewUser : titleReturnUser)
    setSteps(steps)
  }, [did, identityReady, decryptionKey, wallet, connected])

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) setCurrentStepIndex(currentStepIndex + 1)
  }, [currentStepIndex, setCurrentStepIndex, steps]);

  return (
    <>
      {steps.length ?
        <OnboardingModal title={title} steps={steps} currentStepIndex={currentStepIndex} next={nextStep}/> :
        <Loader/>
      }
    </>
  )
};

export default OnboardingController;