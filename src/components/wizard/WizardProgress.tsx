import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  id: string;
  title: string;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep && onStepClick;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center
                    font-medium text-sm transition-all duration-300
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-purple-600 text-white ring-4 ring-purple-500/30'
                        : 'bg-gray-700 text-gray-400'
                    }
                  `}
                  whileHover={isClickable ? { scale: 1.1 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </motion.button>
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isCurrent ? 'text-purple-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}
                  `}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 h-0.5 bg-gray-700 relative">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
