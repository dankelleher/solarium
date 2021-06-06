/* This example requires Tailwind CSS v2.0+ */
import { CheckIcon } from '@heroicons/react/solid'
import {classNames} from "../util";
import {OnboardingStep} from "./OnboardingController";

type Props = {
  steps: OnboardingStep[],
  currentStepIndex: number
}
const Wizard = ({ steps, currentStepIndex }: Props) => {
  return (
    <nav aria-label="Progress">
      <ol className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li key={step.type.valueOf()} className={classNames(stepIdx !== steps.length - 1 ? 'pb-10' : '', 'relative')}>
            {stepIdx < currentStepIndex ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="-ml-px absolute mt-0.5 top-4 left-4 w-0.5 h-full bg-myrtleGreen" aria-hidden="true"/>
                ) : null}
                <a href={'#' + step.type.valueOf()} className="relative flex items-start group items-center">
                    <span className="h-9 flex items-center">
                      <span
                        className="relative z-10 w-8 h-8 flex items-center justify-center bg-myrtleGreen rounded-full group-hover:bg-myrtleGreen-800">
                        <CheckIcon className="w-5 h-5 text-white" aria-hidden="true"/>
                      </span>
                    </span>
                  <span className="ml-4 min-w-0 flex flex-col text-left">
                      <span className="text-xs font-semibold tracking-wide uppercase">{step.type.valueOf()}</span>
                    { step.description && <span className="text-sm text-gray-500">{step.description}</span>}
                    </span>
                </a>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="-ml-px absolute mt-0.5 top-4 left-4 w-0.5 h-full bg-gray-300" aria-hidden="true"/>
                ) : null}
                <a href={'#' + step.type.valueOf()} className="relative flex items-start group items-center" aria-current="step">
                    <span className="h-9 flex items-center" aria-hidden="true">
                      <span
                        className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-myrtleGreen rounded-full">
                        <span className="h-2.5 w-2.5 bg-myrtleGreen rounded-full"/>
                      </span>
                    </span>
                  <span className="ml-4 min-w-0 flex flex-col text-left">
                      <span
                        className="text-xs font-semibold tracking-wide uppercase text-myrtleGreen">{step.type.valueOf()}</span>
                    { step.description && <span className="text-sm text-gray-500">{step.description}</span>}
                    </span>
                </a>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="-ml-px absolute mt-0.5 top-4 left-4 w-0.5 h-full bg-gray-300" aria-hidden="true"/>
                ) : null}
                <a href={'#' + step.type.valueOf()} className="relative flex items-start group items-center">
                    <span className="h-9 flex items-center" aria-hidden="true">
                      <span
                        className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full group-hover:border-gray-400">
                        <span className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300"/>
                      </span>
                    </span>
                  <span className="ml-4 min-w-0 flex flex-col text-left">
                      <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">{step.type.valueOf()}</span>
                    { step.description && <span className="text-sm text-gray-500">{step.description}</span>}
                    </span>
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Wizard
