import React from 'react';
import { motion } from 'framer-motion';
import type { Panel } from '@/types';

interface TimelineProps {
  panels: Panel[];
  selectedPanelId: string | null;
  onSelectPanel: (panelId: string) => void;
  onDeletePanel?: (panelId: string) => void;
  onDeleteAllPanels?: () => void;
  onReorder?: (panelIds: string[]) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  panels,
  selectedPanelId,
  onSelectPanel,
  onDeletePanel,
  onDeleteAllPanels,
}) => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">타임라인</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{panels.length} 패널</span>
          {panels.length > 0 && onDeleteAllPanels && (
            <button
              onClick={() => {
                if (confirm('모든 패널을 삭제하시겠습니까?')) {
                  onDeleteAllPanels();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {panels.map((panel) => (
          <motion.button
            key={panel.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectPanel(panel.id)}
            className={`
              group relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 transition-all
              ${selectedPanelId === panel.id
                ? 'border-purple-500 ring-2 ring-purple-500/30'
                : 'border-gray-700 hover:border-gray-600'
              }
            `}
          >
            {/* Thumbnail */}
            {panel.generatedImage ? (
              <img
                src={panel.generatedImage.imageData}
                alt={`Panel ${panel.panelNumber}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <span className="text-gray-600 text-2xl">🎨</span>
              </div>
            )}

            {/* Panel Number */}
            <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/60 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{panel.panelNumber}</span>
            </div>

            {/* Delete Button */}
            {onDeletePanel && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`패널 ${panel.panelNumber}을 삭제하시겠습니까?`)) {
                    onDeletePanel(panel.id);
                  }
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded bg-red-500/80 hover:bg-red-500 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="text-white text-xs">✕</span>
              </div>
            )}

            {/* Status Indicator */}
            <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
              panel.status === 'approved' ? 'bg-green-500' :
              panel.status === 'preview' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`} />

            {/* Selected Overlay */}
            {selectedPanelId === panel.id && (
              <motion.div
                layoutId="selectedPanel"
                className="absolute inset-0 border-2 border-purple-500 rounded-lg"
              />
            )}
          </motion.button>
        ))}

        {/* Add Panel Button */}
        <button className="flex-shrink-0 w-20 h-28 rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-600 flex items-center justify-center transition-colors">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};
