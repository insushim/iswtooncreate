import React from 'react';

interface PreviewLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  isFullscreen?: boolean;
}

const PreviewLayout: React.FC<PreviewLayoutProps> = ({
  children,
  header,
  isFullscreen = false,
}) => {
  return (
    <div
      className={`min-h-screen bg-gray-950 ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Header */}
      {header && (
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
          {header}
        </header>
      )}

      {/* Preview Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
};

export default PreviewLayout;
