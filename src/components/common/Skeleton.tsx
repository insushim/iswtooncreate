import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded h-4';
    }
  };

  const getSizeStyles = () => {
    const styles: React.CSSProperties = {};
    if (width) styles.width = typeof width === 'number' ? `${width}px` : width;
    if (height) styles.height = typeof height === 'number' ? `${height}px` : height;
    return styles;
  };

  const skeletonElement = (key: number) => (
    <div
      key={key}
      className={`
        bg-gray-700 animate-pulse
        ${getStyles()}
        ${className}
      `}
      style={getSizeStyles()}
    />
  );

  if (count === 1) {
    return skeletonElement(0);
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => skeletonElement(index))}
    </div>
  );
};

// Preset skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-800/50 rounded-xl p-4 border border-gray-700 ${className}`}>
    <Skeleton variant="rectangular" height={160} className="mb-4" />
    <Skeleton variant="text" width="70%" className="mb-2" />
    <Skeleton variant="text" width="50%" />
  </div>
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
);
