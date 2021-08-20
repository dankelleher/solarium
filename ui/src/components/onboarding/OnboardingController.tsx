import OnboardingModal from "./OnboardingModal";
import {useCallback, useEffect, useState} from "react";
import {useChannel} from "../../service/channels/channel";
import {useWallet} from "../../service/wallet/wallet";
import {DEFAULT_CHANNEL} from "../../service/constants";
import {useIdentity} from "../../service/identity";
import WelcomeModal from "./WelcomeModal";
import * as React from "react";
import RequestAliasModal from "../modal/RequestAliasModal";
import ResetIdentityModal from "../modal/ResetIdentityModal";
import AddKeyModal from "../modal/AddKeyModal";

enum StepType {
  CONNECT_WALLET = 'Connect Wallet',
  CREATE_IDENTITY = 'Create Identity',
  JOIN_PUBLIC_CHANNEL = 'Join the Public Lobby',
  DONE = 'Done!'
}

const firstTimeSteps: OnboardingStepTemplate[] = [
  { type: StepType.CONNECT_WALLET, description: 'You\'ll use this to send messages.' },
  {
    type: StepType.CREATE_IDENTITY,
    description: 'This is how you tell others who you are. Don\'t worry, it\'s anonymous!',
  },
  { type: StepType.JOIN_PUBLIC_CHANNEL, description: 'Be polite!'},
  { type: StepType.DONE, description: '' },
]

const returnUserSteps: OnboardingStepTemplate[] = [
  { type: StepType.CONNECT_WALLET, description: 'Reconnect your wallet to see your latest messages' },
  { type: StepType.CREATE_IDENTITY, description: 'Loading your identity.' },
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

const OnboardingController = () => {
  const {wallet, connected} = useWallet();
  const { 
    ready: identityReady,
    error: identityError,
    decryptionKey,
    did,
    createIdentity,
    clearIdentity,
    addKey
  } = useIdentity();
  const { addressBook, joinPublicChannel, initialised } = useChannel()
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [title, setTitle] = useState<string>(titleNewUser)
  
  // modal toggles
  const [showWelcome, setShowWelcome] = useState<boolean>(false)
  const [showSetAlias, setShowSetAlias] = useState<boolean>(false)
  const [showResetIdentity, setShowResetIdentity] = useState<boolean>(false)
  const [showAddKey, setShowAddKey] = useState<boolean>(false)
  
  const createIdentityWithAlias = createIdentity;

  useEffect(() => {
    const connectWalletAction = wallet.connect;
    const createIdentityAction = () => {
      setShowSetAlias(true)
      return new Promise<void>(() => {});
    } 
    const joinPublicChannelAction = joinPublicChannel;
    const doneAction = async () => { };

    const connectWalletSkipCondition = connected;
    const createIdentitySkipCondition = !!did;
    const joinPublicChannelSkipCondition = !!addressBook?.getChannelByName(DEFAULT_CHANNEL)

    const populateStep = (templateStep:OnboardingStepTemplate):OnboardingStep => {
      switch (templateStep.type) {
        case StepType.CONNECT_WALLET: return { ...templateStep, action: connectWalletAction, skipCondition: connectWalletSkipCondition}
        case StepType.CREATE_IDENTITY: return { ...templateStep, action: createIdentityAction, skipCondition: createIdentitySkipCondition}
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
    did, identityReady, decryptionKey, createIdentity,
    wallet, connected,
    addressBook, joinPublicChannel, initialised])

  useEffect(() => {
    let nextStep = currentStepIndex;
    while (steps.length > nextStep && steps[nextStep].skipCondition) {
      nextStep++;
    }
    if (nextStep > currentStepIndex) setCurrentStepIndex(nextStep);
  }, [currentStepIndex, steps, setCurrentStepIndex])
  
  // error handler
  useEffect(() => {
    if (identityError) {
      switch (identityError) {
        case "WALLET_DID_MISMATCH":
          if (!showResetIdentity && did) setShowResetIdentity(true);
          break;
        case "MISSING_OR_INVALID_DECRYPTION_KEY":
          if (!showAddKey) setShowAddKey(true);
          break;
      }
    }
  }, [identityError, did, showResetIdentity, setShowResetIdentity])

  // if a did is not set, this is a new user, show the welcome screen
  // use the presence/absence of the decryption key to ensure LocalStorage has been loaded
  // this avoids the "flash" effect when a did exists but is not loaded from LocalStorage yet
  useEffect(() => setShowWelcome(!did && !!decryptionKey), [did, decryptionKey, setShowWelcome])

  const nextStep = useCallback(
    () => {
      steps[currentStepIndex].action().then(() => {
        setCurrentStepIndex(currentStepIndex + 1)
      })
    },
    [currentStepIndex, setCurrentStepIndex, steps]
  );
  
  const resetIdentity = useCallback(clearIdentity, [clearIdentity]);
  const addKeyToIdentity = useCallback(addKey, [addKey]);

  // const done = useMemo(() => currentStepIndex >= steps.length, [currentStepIndex, steps])

  return (
    <>
      <WelcomeModal show={showWelcome} setShow={setShowWelcome}/>
      <OnboardingModal show={!showWelcome && steps.length > 0} title={title} steps={steps} currentStepIndex={currentStepIndex} next={nextStep}/>
      <RequestAliasModal show={showSetAlias} setShow={setShowSetAlias} onOk={createIdentityWithAlias}/>
      <ResetIdentityModal show={showResetIdentity} setShow={setShowResetIdentity} onOk={resetIdentity}/>
      <AddKeyModal show={showAddKey} setShow={setShowAddKey} onOk={addKeyToIdentity}/>
    </>
  )
}

export default OnboardingController;
