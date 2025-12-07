import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseStyles = `
    bg-gray-800/50 backdrop-blur-sm
    rounded-xl border border-gray-700
  `;

  const variantStyles = {
    default: '',
    hover: 'transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10',
    interactive: 'cursor-pointer transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02]',
  };

  if (variant === 'interactive' && onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${baseStyles} ${variantStyles[variant]} ${paddings[padding]} ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};
