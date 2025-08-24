// app/lib/types.ts

// Define the possible positions for the keychain hole
export type HolePosition = 'none' | 'top-left' | 'top-middle' | 'top-right';

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
   holePosition: HolePosition;
   holeDiameterMm: number;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;    // add this
  previewUrl: string; // URL of the generated image
};

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed password
}
