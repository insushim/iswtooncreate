import React from 'react';
import { motion } from 'framer-motion';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  };

  const currentSize = sizes[size];

  return (
    <label
      className={`
        flex items-start gap-3 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0
          ${currentSize.track}
          rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
          ${checked ? 'bg-purple-600' : 'bg-gray-600'}
        `}
      >
        <motion.span
          initial={false}
          animate={{ x: checked ? (size === 'sm' ? 16 : size === 'md' ? 20 : 28) : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            ${currentSize.thumb}
            rounded-full bg-white shadow-lg
            absolute top-0.5 left-0.5
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          {description && <span className="text-xs text-gray-400 mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
};
