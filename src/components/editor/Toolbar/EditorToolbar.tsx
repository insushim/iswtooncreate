import React from 'react';
import { Button, Tabs } from '@/components/common';
import { useUIStore } from '@/stores';

interface EditorToolbarProps {
  projectTitle: string;
  episodeTitle: string;
  onSave?: () => void;
  onPreview?: () => void;
  onExport?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  projectTitle,
  episodeTitle,
  onSave,
  onPreview,
  onExport,
}) => {
  const { viewMode, setViewMode, zoom, setZoom } = useUIStore();

  const viewModeTabs = [
    { id: 'edit', label: '편집' },
    { id: 'preview', label: '미리보기' },
    { id: 'split', label: '분할' },
  ];

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold">{projectTitle}</h1>
          <span className="text-gray-400">/</span>
          <span className="text-gray-300">{episodeTitle}</span>
        </div>

        {/* Center: View Mode */}
        <div className="flex items-center gap-4">
          <Tabs
            tabs={viewModeTabs}
            activeTab={viewMode}
            onChange={(tab) => setViewMode(tab as 'edit' | 'preview' | 'split')}
            variant="pills"
            size="sm"
          />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg">
            <button
              onClick={() => setZoom(zoom - 10)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-white text-sm w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(zoom + 10)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSave}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            저장
          </Button>
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            미리보기
          </Button>
          <Button variant="primary" size="sm" onClick={onExport}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            내보내기
          </Button>
        </div>
      </div>
    </div>
  );
};
