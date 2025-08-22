// src/app/components/CanvasPreview.tsx

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
// No longer need HolePosition or types here

interface CanvasPreviewProps {
  canvasWidth: number;
  canvasHeight: number;
  isControlsVisible: boolean;
  imageLoaded: boolean;
  isExporting: boolean;
  onOpenSettings: () => void;
  onExport: () => void;
  // REMOVED the hole visualization props
}

export const CanvasPreview = forwardRef<HTMLCanvasElement, CanvasPreviewProps>(
  (
    {
      canvasWidth,
      canvasHeight,
      isControlsVisible,
      imageLoaded,
      isExporting,
      onOpenSettings,
      onExport,
    },
    ref
  ) => {
    // We can simplify this. The parent will hold the ref directly.
    // The useImperativeHandle is still good practice for forwarding refs to custom components.
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(ref, () => internalCanvasRef.current!);

    // REMOVED the useEffect that was drawing the hole.

    return (
      <div className="relative">
        <canvas
          ref={internalCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`bg-gray-200 rounded-lg shadow-md transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
        />

        {/* --- This overlay container is what we'll keep --- */}
        <div
          className={`absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-50 transition-opacity duration-300 rounded-lg ${isExporting ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
          <p className="text-white text-lg">Exporting...</p>
        </div>

        {imageLoaded && (
          <div className="absolute top-2 right-2 flex space-x-2">
            <button
              onClick={onOpenSettings}
              className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Open settings"
            >
              {/* Settings Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button
              onClick={onExport}
              disabled={isExporting}
              className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              aria-label="Export 3MF file"
            >
              Export
            </button>
          </div>
        )}
      </div>
    );
  }
);

CanvasPreview.displayName = 'CanvasPreview';

export default CanvasPreview;
