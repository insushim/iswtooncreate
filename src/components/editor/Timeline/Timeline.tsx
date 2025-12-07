import React from 'react';
import { motion } from 'framer-motion';
import type { Panel } from '@/types';

interface TimelineProps {
  panels: Panel[];
  selectedPanelId: string | null;
  onSelectPanel: (panelId: string) => void;
  onReorder?: (panelIds: string[]) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  panels,
  selectedPanelId,
  onSelectPanel,
}) => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">타임라인</h3>
        <span className="text-sm text-gray-400">{panels.length} 패널</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {panels.map((panel) => (
          <motion.button
            key={panel.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectPanel(panel.id)}
            className={`
              relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 transition-all
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
