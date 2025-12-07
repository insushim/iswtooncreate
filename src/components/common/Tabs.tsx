import React from 'react';
import { motion } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-5 py-2.5 text-lg gap-2.5',
  };

  const renderTabs = () => {
    switch (variant) {
      case 'pills':
        return (
          <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                className={`
                  flex items-center ${sizes[size]} rounded-lg
                  font-medium transition-all duration-200
                  ${fullWidth ? 'flex-1 justify-center' : ''}
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        );

      case 'underline':
        return (
          <div className={`flex border-b border-gray-700 ${fullWidth ? 'w-full' : ''} ${className}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                className={`
                  relative flex items-center ${sizes[size]}
                  font-medium transition-colors duration-200
                  ${fullWidth ? 'flex-1 justify-center' : ''}
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${activeTab === tab.id ? 'text-purple-400' : 'text-gray-400 hover:text-white'}
                `}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                  />
                )}
              </button>
            ))}
          </div>
        );

      default:
        return (
          <div
            className={`
              flex bg-gray-800 rounded-lg p-1
              ${fullWidth ? 'w-full' : 'inline-flex'}
              ${className}
            `}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                className={`
                  relative flex items-center ${sizes[size]} rounded-md
                  font-medium transition-all duration-200
                  ${fullWidth ? 'flex-1 justify-center' : ''}
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'}
                `}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gray-700 rounded-md"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        );
    }
  };

  return renderTabs();
};
