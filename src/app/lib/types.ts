// app/lib/types.ts

/**
* A comprehensive type defining all user-configurable settings.
*/
export type Settings = {
   conversionMode: 'brightness' | 'color';
   brightnessThreshold: number;
   targetColorIndex: number;
   hueTolerance: number;
   saturationTolerance: number;
   lightnessTolerance: number;
   enableSmoothing: boolean;
   baseHeight: number;
   detailHeight: number;
   targetWidthMm: number; // User-specified width in mm
   targetHeightMm: number;  // User-specified height in mm
   useWidthInput: boolean
};
