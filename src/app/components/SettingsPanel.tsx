// components/SettingsPanel.tsx
'use client';

import React, { useState, useEffect } from "react";

import { PRINT_COLOR_BASE, PRINT_COLOR_RAISED } from "../lib/constants";
import { Settings, HolePosition } from '../lib/types';
import Tooltip from "./ui/Tooltip";

interface SettingsPanelProps {
  settings: Omit<Settings, 'processingResolution'>;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  predefinedColors: { label: string; color: string }[];
  onClose: () => void;
  aspectRatio: number;
}

// UTILITY for clamping numbers
const clamp = (value: number, min: number, max: number): number => {
  const num = isNaN(value) ? min : value;
  return Math.max(min, Math.min(num, max));
};

// MODIFIED: Formatting function now rounds to the nearest integer
const formatDimension = (value: number): string => {
  if (isNaN(value)) return "0";
  return Math.round(value).toString();
};

function SettingsPanel({ settings, onSettingsChange, predefinedColors, onClose, aspectRatio }: SettingsPanelProps) {
  // --- LOCAL STATE FOR INPUT STRINGS ---
  const [widthStr, setWidthStr] = useState(formatDimension(settings.targetWidthMm));
  const [heightStr, setHeightStr] = useState(formatDimension(settings.targetHeightMm));
  const [baseHeightStr, setBaseHeightStr] = useState(settings.baseHeight.toString());
  const [detailHeightStr, setDetailHeightStr] = useState(settings.detailHeight.toString());

  // --- EFFECT TO SYNC WITH PARENT STATE ---
  useEffect(() => {
    setWidthStr(formatDimension(settings.targetWidthMm));
    setHeightStr(formatDimension(settings.targetHeightMm));
    setBaseHeightStr(settings.baseHeight.toString());
    setDetailHeightStr(settings.detailHeight.toString());
  }, [settings]);

  // --- ONCHANGE HANDLERS ---
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentVal = e.target.value;
    setWidthStr(currentVal);
    const parsedWidth = parseFloat(currentVal) || 0;
    if (aspectRatio > 0) {
      setHeightStr(formatDimension(parsedWidth / aspectRatio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentVal = e.target.value;
    setHeightStr(currentVal);
    const parsedHeight = parseFloat(currentVal) || 0;
    if (aspectRatio > 0) {
      setWidthStr(formatDimension(parsedHeight * aspectRatio));
    }
  };

  // --- ONBLUR HANDLERS ---
  const handleDimensionBlur = () => {
    const minDim = 40;
    const maxDim = 210;
    let finalWidth = parseFloat(widthStr);
    let finalHeight = parseFloat(heightStr);

    if (settings.useWidthInput) {
      finalWidth = clamp(finalWidth, minDim, maxDim);
      finalHeight = aspectRatio > 0 ? finalWidth / aspectRatio : 0;
      if (finalHeight > maxDim) {
        finalHeight = maxDim;
        finalWidth = aspectRatio > 0 ? finalHeight * aspectRatio : 0;
      } else if (finalHeight < minDim) {
        finalHeight = minDim;
        finalWidth = aspectRatio > 0 ? finalHeight * aspectRatio : 0;
      }
    } else {
      finalHeight = clamp(finalHeight, minDim, maxDim);
      finalWidth = aspectRatio > 0 ? finalHeight * aspectRatio : 0;
      if (finalWidth > maxDim) {
        finalWidth = maxDim;
        finalHeight = aspectRatio > 0 ? finalWidth / aspectRatio : 0;
      } else if (finalWidth < minDim) {
        finalWidth = minDim;
        finalHeight = aspectRatio > 0 ? finalWidth / aspectRatio : 0;
      }
    }

    // MODIFIED: Round final values before updating parent state
    onSettingsChange({
      targetWidthMm: Math.round(finalWidth),
      targetHeightMm: Math.round(finalHeight)
    });
  };

  const handleBaseHeightBlur = () => {
    const parsed = parseFloat(baseHeightStr);
    // Base/Detail height can keep decimals, so no change here
    const clamped = clamp(parsed, 0.2, 10);
    onSettingsChange({ baseHeight: clamped });
  };

  const handleDetailHeightBlur = () => {
    const parsed = parseFloat(detailHeightStr);
    // Base/Detail height can keep decimals, so no change here
    const clamped = clamp(parsed, 0.1, 1);
    onSettingsChange({ detailHeight: clamped });
  };


  return (
    <div className="w-96 flex-shrink-0 p-6 bg-white rounded-2xl border shadow-lg space-y-6 animate-fade-in">
      {/* Panel Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Settings</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors" aria-label="Close settings">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* --- Conversion Mode Section --- */}
      <div className="border-t pt-5">
        <h4 className="text-md font-semibold text-gray-700 text-center mb-4">Image Conversion</h4>
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-lg">
          <button onClick={() => onSettingsChange({ conversionMode: 'brightness' })} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${settings.conversionMode === 'brightness' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>By Brightness</button>
          <button onClick={() => onSettingsChange({ conversionMode: 'color' })} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${settings.conversionMode === 'color' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>By Color</button>
        </div>

        {settings.conversionMode === 'brightness' ? (
          <div className="space-y-4 pt-4">
            <label htmlFor="brightnessThreshold" className="block text-sm font-medium text-gray-800">Brightness Cutoff: {settings.brightnessThreshold}</label>
            <input id="brightnessThreshold" type="range" min="0" max="100" value={settings.brightnessThreshold} onChange={(e) => onSettingsChange({ brightnessThreshold: Number(e.target.value) })} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <div>
              <label htmlFor="targetColor" className="block text-sm font-medium text-gray-800">Target Color: <span className="font-semibold">{predefinedColors[settings.targetColorIndex].label}</span></label>
              <input id="targetColor" type="range" min="0" max={predefinedColors.length - 1} value={settings.targetColorIndex} onChange={(e) => onSettingsChange({ targetColorIndex: Number(e.target.value) })} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer mt-1" />
            </div>
            <div className="border-t pt-5 space-y-4">
              <h4 className="text-md font-semibold text-gray-700 text-center">Fine-Tune Selection</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor="hueTolerance" className="text-sm font-medium text-gray-800">Hue Tolerance: {settings.hueTolerance}</label>
                    <Tooltip text="Controls which shades of a color to include. A high value for 'green' will also include teal and lime." />
                  </div>
                  <input id="hueTolerance" type="range" min="0" max="180" value={settings.hueTolerance} onChange={(e) => onSettingsChange({ hueTolerance: Number(e.target.value) })} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor="saturationTolerance" className="text-sm font-medium text-gray-800">Saturation Tolerance: {settings.saturationTolerance}</label>
                    <Tooltip text="Controls the color's vibrancy. A high value includes both neon, vibrant colors and dull, grayish colors." />
                  </div>
                  <input id="saturationTolerance" type="range" min="0" max="100" value={settings.saturationTolerance} onChange={(e) => onSettingsChange({ saturationTolerance: Number(e.target.value) })} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor="lightnessTolerance" className="text-sm font-medium text-gray-800">Lightness Tolerance: {settings.lightnessTolerance}</label>
                    <Tooltip text="Controls the color's brightness. A high value includes both light, pastel versions and dark, shadowy versions of the color." />
                  </div>
                  <input id="lightnessTolerance" type="range" min="0" max="100" value={settings.lightnessTolerance} onChange={(e) => onSettingsChange({ lightnessTolerance: Number(e.target.value) })} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- 3D Model Dimensions Section --- */}
      <div className="border-t pt-5">
        <h4 className="text-md font-semibold text-gray-700 text-center mb-4">Model Dimensions (Aspect Ratio Locked)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="targetWidthMm" className="block text-sm font-medium text-gray-700">Width (mm)</label>
            <input
              type="number"
              step="1" // Hint to the browser we are dealing with integers
              id="targetWidthMm"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={widthStr}
              onChange={handleWidthChange}
              onFocus={() => onSettingsChange({ useWidthInput: true })}
              onBlur={handleDimensionBlur}
              min="40"
              max="210"
            />
          </div>
          <div>
            <label htmlFor="targetHeightMm" className="block text-sm font-medium text-gray-700">Height (mm)</label>
            <input
              type="number"
              step="1" // Hint to the browser we are dealing with integers
              id="targetHeightMm"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={heightStr}
              onChange={handleHeightChange}
              onFocus={() => onSettingsChange({ useWidthInput: false })}
              onBlur={handleDimensionBlur}
              min="40"
              max="210"
            />
          </div>
        </div>
      </div>

      {/* --- 3D Print Settings Section --- */}
      <div className="border-t pt-5">
        <h4 className="text-md font-semibold text-gray-700 text-center mb-4">Print Layer Settings</h4>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="block w-8 h-8 rounded-md border border-gray-300" style={{ backgroundColor: PRINT_COLOR_RAISED }}></span>
            <span className="text-sm font-medium text-gray-800">Raised Detail</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block w-8 h-8 rounded-md border border-gray-300" style={{ backgroundColor: PRINT_COLOR_BASE }}></span>
            <span className="text-sm font-medium text-gray-800">Base</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="baseHeight" className="block text-sm font-medium text-gray-800 mb-1">Base Thickness (mm)</label>
            <input
              id="baseHeight"
              type="number"
              step="0.1"
              min="0.2"
              max="10"
              value={baseHeightStr}
              onChange={(e) => setBaseHeightStr(e.target.value)}
              onBlur={handleBaseHeightBlur}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label htmlFor="detailHeight" className="block text-sm font-medium text-gray-800 mb-1">Detail Height (mm)</label>
            <input
              id="detailHeight"
              type="number"
              step="0.1"
              min="0.1"
              max="1"
              value={detailHeightStr}
              onChange={(e) => setDetailHeightStr(e.target.value)}
              onBlur={handleDetailHeightBlur}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
        </div>
        <div className="mt-6 border-t pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="smoothing" className="text-sm font-medium text-gray-800">Enable Smoothing Filter</label>
              <Tooltip text="Removes small, isolated dots (noise) to create cleaner surfaces for 3D printing." />
            </div>
            <input
              id="smoothing"
              type="checkbox"
              checked={settings.enableSmoothing}
              onChange={(e) => onSettingsChange({ enableSmoothing: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          </div>
        </div>
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-700">Keychain Hole</h3>
          <div>
            <label htmlFor="holePosition" className="block text-sm font-medium text-gray-600 mb-1">
              Position
            </label>
            <select
              id="holePosition"
              value={settings.holePosition}
              onChange={(e) => onSettingsChange({ holePosition: e.target.value as HolePosition })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="none">None</option>
              <option value="top-middle">Top Middle</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>

          {settings.holePosition !== 'none' && (
            <div>
              <label htmlFor="holeDiameter" className="block text-sm font-medium text-gray-600 mb-1">
                Hole Diameter (mm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="holeDiameter"
                  value={settings.holeDiameterMm}
                  onChange={(e) => onSettingsChange({ holeDiameterMm: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  step="0.5"
                  min="1"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">mm</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
