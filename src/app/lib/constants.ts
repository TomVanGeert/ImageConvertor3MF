// app/lib/constants.ts

/**
* A list of predefined colors for the 'By Specific Color' conversion mode.
* This makes it easy for users to select common colors without a color picker.
*/
export const PREDEFINED_TARGETS: { name: string; hex: string }[] = [
   { name: 'Black', hex: '#000000' },
   { name: 'White', hex: '#FFFFFF' },
   { name: 'Sky Blue', hex: '#87CEEB' },
   { name: 'Foliage Green', hex: '#228B22' },
   { name: 'Golden Yellow', hex: '#FFD700' },
   { name: 'Vibrant Red', hex: '#DC143C' },
   { name: 'Medium Purple', hex: '#9370DB' },
   { name: 'Warm Skin Tone', hex: '#F2D4B7' },
];

/**
* Static color definitions for the 3D print model.
* These are the final colors that will be embedded in the 3MF file.
*/

export const PRINT_COLOR_RAISED = '#000000FF'; // Black for the raised part of the model.
export const PRINT_COLOR_BASE = '#FFFFFFFF';   // White for the base of the model.

