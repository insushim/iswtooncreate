import React, { forwardRef } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, showCount = false, maxLength, className = '', value, ...props }, ref) => {
    const currentLength = value ? String(value).length : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-400 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={`
              w-full px-4 py-3 rounded-lg
              bg-gray-700 border border-gray-600
              text-white placeholder-gray-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-none
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        <div className="flex justify-between mt-1">
          <div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
          </div>
          {showCount && maxLength && (
            <p className={`text-sm ${currentLength >= maxLength ? 'text-red-400' : 'text-gray-500'}`}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
