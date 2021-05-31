import OnboardingModal from "./OnboardingModal";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useChannel} from "../../service/channels/channel";
import {useWallet} from "../../service/wallet/wallet";
import {useIdentity} from "../../service/identity";
import Loader from "../Loader";

enum StepType {
  CONNECT_WALLET = 'Connect Wallet',
  CREATE_IDENTITY = 'Create Identity',
  ADD_KEY = 'Add Browser Key',
  JOIN_PUBLIC_CHANNEL = 'Join the Public Lobby',
  DONE = 'Done!'
}

const firstTimeSteps: OnboardingStepTemplate[] = [
  { type: StepType.CONNECT_WALLET, description: 'You\'ll use this to send messages' },
  {
    type: StepType.CREATE_IDENTITY,
    description: 'This is how you tell others who you are. Don\'t worry, it\'s anonymous!',
  },
  { type: StepType.ADD_KEY, description: 'Messages you send will be encrypted with this.' },
  { type: StepType.JOIN_PUBLIC_CHANNEL, description: 'Say hello!'},
  { type: StepType.DONE, description: '' },
]

const returnUserSteps: OnboardingStepTemplate[] = [
  { type: StepType.CONNECT_WALLET, description: 'Reconnect your wallet to see your latest messages' },
  { type: StepType.DONE, description: '' },
]

const titleNewUser = "Welcome to Solarium!";
const titleReturnUser = "Welcome back to Solarium!";

export type OnboardingStep = {
  type: StepType,
  description: string,
  action: () => Promise<void>,
}

type OnboardingStepTemplate = Omit<OnboardingStep, 'action'>

const OnboardingController = () => {
  const {wallet, connected} = useWallet();
  const { ready: identityReady, decryptionKey, did} = useIdentity();
  const {} = useChannel()
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [title, setTitle] = useState<string>(titleNewUser)
  
  useEffect(() => {
    const connectWalletAction = wallet.connect;
    const createIdentityAction = async () => { };
    const addKeyAction = async () => { };
    const joinPublicChannelAction = async () => { };
    const doneAction = async () => { };
    const populateStep = (templateStep:OnboardingStepTemplate):OnboardingStep => {
      switch (templateStep.type) {
        case StepType.CONNECT_WALLET: return { ...templateStep, action: connectWalletAction}
        case StepType.CREATE_IDENTITY: return { ...templateStep, action: createIdentityAction}
        case StepType.ADD_KEY: return { ...templateStep, action: addKeyAction}
        case StepType.JOIN_PUBLIC_CHANNEL: return { ...templateStep, action: joinPublicChannelAction}
        case StepType.DONE:return { ...templateStep, action: doneAction}
      }
    }
    const populateSteps = (templateSteps:OnboardingStepTemplate[]):OnboardingStep[] => templateSteps.map(populateStep);
    
    const isNewUser = !did;
    const stepTemplates = isNewUser ? firstTimeSteps : returnUserSteps;
    
    const populatedSteps = populateSteps(stepTemplates) 

    setTitle(isNewUser ? titleNewUser : titleReturnUser)
    setSteps(populatedSteps)
  }, [did, identityReady, decryptionKey, wallet, connected])

  const nextStep = useCallback(
    () => {
      steps[currentStepIndex].action().then(() => {
        setCurrentStepIndex(currentStepIndex + 1)  
      })
    }, 
    [currentStepIndex, setCurrentStepIndex, steps]
  );
  const done = useMemo(() => currentStepIndex >= steps.length, [currentStepIndex, steps])

  return (
    <>
      { !done &&
      (steps.length ?
          <OnboardingModal title={title} steps={steps} currentStepIndex={currentStepIndex} next={nextStep}/> :
          <Loader/>
      )}
    </>
  )
}

export default OnboardingController;