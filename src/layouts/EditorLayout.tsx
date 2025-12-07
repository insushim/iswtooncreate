import React from 'react';

interface EditorLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightPanel?: React.ReactNode;
  toolbar?: React.ReactNode;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  sidebar,
  rightPanel,
  toolbar,
}) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Toolbar */}
      {toolbar && (
        <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-30">
          {toolbar}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {sidebar && (
          <aside className="w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto flex-shrink-0">
            {sidebar}
          </aside>
        )}

        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Right Panel */}
        {rightPanel && (
          <aside className="w-72 bg-gray-800/50 border-l border-gray-700 overflow-y-auto flex-shrink-0">
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
};

export default EditorLayout;
