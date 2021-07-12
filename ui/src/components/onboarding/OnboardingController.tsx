import OnboardingModal from "./OnboardingModal";
import {useCallback, useEffect, useState} from "react";
import {useChannel} from "../../service/channels/channel";
import {useWallet} from "../../service/wallet/wallet";
import {DEFAULT_CHANNEL} from "../../service/constants";
import {useIdentity} from "../../service/identity";
import WelcomeModal from "./WelcomeModal";
import * as React from "react";

enum StepType {
  CONNECT_WALLET = 'Connect Wallet',
  CREATE_IDENTITY = 'Create Identity',
  ADD_KEY = 'Add Browser Key',
  JOIN_PUBLIC_CHANNEL = 'Join the Public Lobby',
  DONE = 'Done!'
}

const firstTimeSteps: OnboardingStepTemplate[] = [
  { type: StepType.CONNECT_WALLET, description: 'You\'ll use this to send messages.' },
  {
    type: StepType.CREATE_IDENTITY,
    description: 'This is how you tell others who you are. Don\'t worry, it\'s anonymous!',
  },
  { type: StepType.ADD_KEY, description: 'Messages you send will be encrypted with this.' },
  { type: StepType.JOIN_PUBLIC_CHANNEL, description: 'Be polite!'},
  { type: StepType.DONE, description: '' },
]

const returnUserSteps: OnboardingStepTemplate[] = [
  { type: StepType.CONNECT_WALLET, description: 'Reconnect your wallet to see your latest messages' },
  { type: StepType.CREATE_IDENTITY, description: 'Loading your identity.' },
  { type: StepType.ADD_KEY, description: 'Validating your key.' },
  { type: StepType.JOIN_PUBLIC_CHANNEL, description: 'Be polite!'},
  { type: StepType.DONE, description: '' },
]

const titleNewUser = "Welcome to Solarium!";
const titleReturnUser = "Welcome back to Solarium!";

export type OnboardingStep = {
  type: StepType,
  description: string,
  action: () => Promise<void>,
  skipCondition: boolean,
}

type OnboardingStepTemplate = Omit<OnboardingStep, 'action' | 'skipCondition'>

type Props = {
  forceShowWelcome: boolean
  setForceShowWelcome: (show: boolean) => void,
}

const OnboardingController = ({forceShowWelcome, setForceShowWelcome} : Props) => {
  const {wallet, connected} = useWallet();
  const { ready: identityReady, decryptionKey, did, createIdentity, addKey} = useIdentity();
  const { addressBook, joinPublicChannel, initialised } = useChannel()
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [title, setTitle] = useState<string>(titleNewUser)
  const [showWelcome, setShowWelcome] = useState<boolean>(true)

  useEffect(() => {
    const connectWalletAction = wallet.connect;
    const createIdentityAction = createIdentity;
    const addKeyAction = addKey;
    const joinPublicChannelAction = joinPublicChannel;
    const doneAction = async () => { };

    const connectWalletSkipCondition = connected;
    const createIdentitySkipCondition = !!did;
    const addKeySkipCondition = identityReady;
    const joinPublicChannelSkipCondition = !!addressBook?.getChannelByName(DEFAULT_CHANNEL)

    const populateStep = (templateStep:OnboardingStepTemplate):OnboardingStep => {
      switch (templateStep.type) {
        case StepType.CONNECT_WALLET: return { ...templateStep, action: connectWalletAction, skipCondition: connectWalletSkipCondition}
        case StepType.CREATE_IDENTITY: return { ...templateStep, action: createIdentityAction, skipCondition: createIdentitySkipCondition}
        case StepType.ADD_KEY: return { ...templateStep, action: addKeyAction, skipCondition: addKeySkipCondition}
        case StepType.JOIN_PUBLIC_CHANNEL: return { ...templateStep, action: joinPublicChannelAction, skipCondition: joinPublicChannelSkipCondition}
        case StepType.DONE: return { ...templateStep, action: doneAction, skipCondition: false}
      }
    }

    const populateSteps = (templateSteps:OnboardingStepTemplate[]):OnboardingStep[] => templateSteps.map(populateStep);

    const isNewUser = !initialised;
    const stepTemplates = isNewUser ? firstTimeSteps : returnUserSteps;

    const populatedSteps = populateSteps(stepTemplates)

    setTitle(isNewUser ? titleNewUser : titleReturnUser)
    setSteps(populatedSteps)
  }, [
    did, identityReady, decryptionKey, addKey, createIdentity,
    wallet, connected,
    addressBook, joinPublicChannel, initialised])

  useEffect(() => {
    let nextStep = currentStepIndex;
    while (steps.length > nextStep && steps[nextStep].skipCondition) {
      nextStep++;
    }
    if (nextStep > currentStepIndex) setCurrentStepIndex(nextStep);
  }, [currentStepIndex, steps, setCurrentStepIndex])

  useEffect(() => {
    setShowWelcome(!did && showWelcome) // will always be false, once showWelcome turns false.
    }, [did, showWelcome, setShowWelcome])

  const nextStep = useCallback(
    () => {
      steps[currentStepIndex].action().then(() => {
        setCurrentStepIndex(currentStepIndex + 1)
      })
    },
    [currentStepIndex, setCurrentStepIndex, steps]
  );

  // const done = useMemo(() => currentStepIndex >= steps.length, [currentStepIndex, steps])

  return (
    <>
      <WelcomeModal show={forceShowWelcome || showWelcome} setShow={(show) => {setForceShowWelcome(show); setShowWelcome(show)}}/>
      <OnboardingModal show={!showWelcome && steps.length > 0} title={title} steps={steps} currentStepIndex={currentStepIndex} next={nextStep}/>
      {/* TODO: @Dan I feel this loader did nothing... */}
      {/*<Loader/>*/}
    </>
  )
}

export default OnboardingController;
