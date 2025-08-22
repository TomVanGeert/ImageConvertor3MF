// components/CanvasPreview.tsx
'use client';

import React, { forwardRef } from 'react';
import { IoSettingsSharp } from 'react-icons/io5'; // Make sure you have run 'npm install react-icons'

interface CanvasPreviewProps {
  canvasWidth: number;
  canvasHeight: number;
  imageLoaded: boolean;
  isExporting: boolean;
  isControlsVisible: boolean;
  onOpenSettings: () => void;
  onExport: () => void;
}

// --- THIS IS THE CORRECTED LINE ---
// We now correctly destructure isControlsVisible and onOpenSettings
const CanvasPreview = forwardRef<HTMLCanvasElement, CanvasPreviewProps>(
  ({ canvasWidth, canvasHeight, imageLoaded, isExporting, isControlsVisible, onOpenSettings, onExport }, ref) => {

    return (
      <div className="relative flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-inner space-y-4">

        {/* --- THE SETTINGS BUTTON IS RE-ADDED HERE --- */}
        {imageLoaded && !isControlsVisible && (
          <button
            onClick={onOpenSettings}
            className="absolute top-2 right-2 z-10 p-2 bg-white/70 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
            aria-label="Open settings"
            title="Open settings"
          >
            <IoSettingsSharp size={24} />
          </button>
        )}

        <div
          className="relative flex items-center justify-center border-2 border-dashed border-gray-300 bg-white overflow-hidden"
          style={{
            width: canvasWidth > 0 ? canvasWidth : 300,
            height: canvasHeight > 0 ? canvasHeight : 200
          }}
        >
          <canvas
            ref={ref}
            width={canvasWidth}
            height={canvasHeight}
            className={imageLoaded ? 'block' : 'hidden'}
          />
          {!imageLoaded && <div className="text-gray-400">Loading Preview...</div>}
        </div>

        <button
          onClick={onExport}
          disabled={isExporting || !imageLoaded}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export to 3MF'}
        </button>
      </div>
    );
  }
);

CanvasPreview.displayName = 'CanvasPreview';

export default CanvasPreview;
