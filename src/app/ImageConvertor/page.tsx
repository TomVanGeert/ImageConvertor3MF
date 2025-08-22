'use client';

// --- React and Library Imports ---
import React, { useState, useRef, useEffect } from "react"; // Core React hooks for state, refs, and side effects.
import { useDropzone } from "react-dropzone"; // A hook for creating a drag-and-drop file upload zone.
import JSZip from 'jszip'; // A library for creating .zip files, necessary for the .3mf format.

// --- Reusable Tooltip Component ---
/**
* A small question mark icon with a hover-activated tooltip for providing help text.
* It's styled with Tailwind CSS and designed to be self-contained.
* @param {{text: string}} props - The component props.
* @param {string} props.text - The help text to display in the tooltip.
*/
const Tooltip = ({ text }: { text: string }) => {
return (
  <div className="relative flex items-center group">
    {/* The question mark icon that the user hovers over. */}
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {/* The tooltip pop-up box. It's hidden by default (`opacity-0`) and becomes visible when the parent `group` is hovered. */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      {text}
      {/* This small div creates the triangle pointer at the bottom of the tooltip. */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
    </div>
  </div>
);
};


// --- Helper Functions and Constants ---

/**
* Converts a HEX color string (e.g., #FF33AA) to an RGB object.
* @param {string} hex - The hex color string.
* @returns {{r: number, g: number, b: number} | null} - An object with r, g, b values or null if invalid.
*/
const hexToRgb = (hex: string) => {
const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

/**
* Converts RGB color values to HSL (Hue, Saturation, Lightness) values.
* HSL is useful for comparing colors in a more human-perceptive way.
* @param {number} r - Red value (0-255).
* @param {number} g - Green value (0-255).
* @param {number} b - Blue value (0-255).
* @returns {{h: number, s: number, l: number}} - An object with h, s, l values.
*/
const rgbToHsl = (r: number, g: number, b: number) => {
 r /= 255; g /= 255; b /= 255;
 const max = Math.max(r, g, b), min = Math.min(r, g, b);
 let h = 0, s = 0, l = (max + min) / 2;
 if (max !== min) {
     const d = max - min;
     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
     switch (max) {
         case r: h = (g - b) / d + (g < b ? 6 : 0); break;
         case g: h = (b - r) / d + 2; break;
         case b: h = (r - g) / d + 4; break;
     }
     h /= 6;
 }
 return { h: h * 360, s: s * 100, l: l * 100 };
};

// A list of predefined colors for the 'By Specific Color' conversion mode.
const PREDEFINED_TARGETS = [
 { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Sky Blue', hex: '#87CEEB' },
 { name: 'Foliage Green', hex: '#228B22' }, { name: 'Golden Yellow', hex: '#FFD700' }, { name: 'Vibrant Red', hex: '#DC143C' },
 { name: 'Medium Purple', hex: '#9370DB' }, { name: 'Warm Skin Tone', hex: '#F2D4B7' },
];

// Static color definitions for the 3D print model. These are not user-modifiable.
const PRINT_COLOR_RAISED = '#000000'; // Black for the raised part of the model.
const PRINT_COLOR_BASE = '#FFFFFF';   // White for the base of the model.

// --- Main React Component ---
export default function ImageConverter() {
// --- State Management ---

// State for the uploaded image and canvas display
const [image, setImage] = useState<string | null>(null); // Stores the base64 data URL of the uploaded image.
const [canvasWidth, setCanvasWidth] = useState(0); // The calculated width of the display canvas.
const [canvasHeight, setCanvasHeight] = useState(0); // The calculated height of the display canvas.
const [imageLoaded, setImageLoaded] = useState(false); // A flag to track if the image has been fully loaded into the <img> element.

// State for UI visibility and conversion parameters
const [isControlsVisible, setIsControlsVisible] = useState(false); // Toggles the visibility of the settings panel.
const [conversionMode, setConversionMode] = useState<'brightness' | 'color'>('brightness'); // Tracks the selected conversion method.
const [brightnessThreshold, setBrightnessThreshold] = useState(50); // User-defined threshold for the 'brightness' mode.
const [targetColorIndex, setTargetColorIndex] = useState(0); // Index for the selected color from PREDEFINED_TARGETS.
const [hueTolerance, setHueTolerance] = useState(30); // Tolerance for hue matching in 'color' mode.
const [saturationTolerance, setSaturationTolerance] = useState(50); // Tolerance for saturation matching.
const [lightnessTolerance, setLightnessTolerance] = useState(50); // Tolerance for lightness matching.

// State for the 3D model's physical dimensions, editable by the user.
const [baseHeight, setBaseHeight] = useState(1.0); // The thickness of the model's base plate in mm.
const [detailHeight, setDetailHeight] = useState(0.2); // The height of the raised details on the model in mm.
const [enableSmoothing, setEnableSmoothing] = useState(true); // State for the smoothing filter.

// --- Refs for DOM Elements ---
// Refs provide direct access to the canvas and image DOM elements.
const canvasRef = useRef<HTMLCanvasElement | null>(null);
const imgRef = useRef<HTMLImageElement | null>(null);

// --- File Dropzone Logic ---
// Sets up the drag-and-drop functionality.
const onDrop = (acceptedFiles: File[]) => {
 const file = acceptedFiles[0];
 if (file) {
   const reader = new FileReader();
   reader.onload = () => { setImage(reader.result as string); setImageLoaded(false); }; // When file is read, update state.
   reader.readAsDataURL(file);
 }
};
// useDropzone hook provides props to make any element a dropzone.
const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

// --- Canvas and Image Sizing Logic ---
/**
* Calculates the optimal dimensions for the canvas to fit the screen
* while maintaining the image's aspect ratio.
*/
const calculateCanvasDimensions = () => {
 if (!imgRef.current || !imgRef.current.naturalWidth) return;
 const img = imgRef.current;
 const panelWidth = isControlsVisible ? 384 + 24 : 0; // Account for settings panel width
 const availableWidth = window.innerWidth * 0.9 - panelWidth;
 const availableHeight = window.innerHeight * 0.70;
 const aspectRatio = img.naturalWidth / img.naturalHeight;
 
 let targetWidth = availableWidth;
 let targetHeight = targetWidth / aspectRatio;
 
 // If the calculated height is too big, resize based on height instead.
 if (targetHeight > availableHeight) {
   targetHeight = availableHeight;
   targetWidth = targetHeight * aspectRatio;
 }
 setCanvasWidth(targetWidth);
 setCanvasHeight(targetHeight);
};

/**
* Callback function that runs once the hidden <img> element has loaded the image file.
* It sets a flag and makes the settings controls visible.
*/
const handleImageLoad = () => {
 setImageLoaded(true);
 setIsControlsVisible(true);
};

// --- Heightmap Generation ---
/**
* Reads the pixel data from the processed (black and white) canvas and converts it
* into a 2D array of brightness values (0-255). This array is the "heightmap".
* @returns {number[][] | null} - A 2D array representing the heightmap, or null on failure.
*/
const getHeightmap = () => {
 if (!canvasRef.current || canvasWidth === 0 || canvasHeight === 0) return null;
 const canvas = canvasRef.current;
 const ctx = canvas.getContext('2d');
 if (!ctx) return null;
 const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
 const data = imageData.data;
 const heightmap: number[][] = [];
 for (let y = 0; y < canvas.height; y++) {
   heightmap[y] = [];
   for (let x = 0; x < canvas.width; x++) {
     const i = (y * canvas.width + x) * 4;
     heightmap[y][x] = data[i]; // Use the Red channel value (since it's grayscale, R=G=B).
   }
 }
 return heightmap;
};

// --- NEW SMOOTHING FILTER ---
/**
* Applies a 3x3 median/majority filter to a black and white ImageData object.
* This removes isolated pixels (salt-and-pepper noise), smoothing the image.
* @param {ImageData} imageData - The source black and white image data.
* @param {number} width - The width of the image.
* @param {number} height - The height of the image.
* @returns {ImageData} A new ImageData object with the smoothed data.
*/
const applySmoothingFilter = (imageData: ImageData, width: number, height: number): ImageData => {
   const srcData = imageData.data;
   // We need a new buffer to write to, as we can't modify the source data in place
   // while we are still reading from it for neighboring pixels.
   const dstData = new Uint8ClampedArray(srcData.length);

   for (let y = 0; y < height; y++) {
       for (let x = 0; x < width; x++) {
           const i = (y * width + x) * 4;

           // For pixels on the edge, we can't form a full 3x3 grid.
           // A simple solution is to just copy them as-is.
           if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
               dstData[i] = srcData[i];
               dstData[i + 1] = srcData[i + 1];
               dstData[i + 2] = srcData[i + 2];
               dstData[i + 3] = srcData[i + 3]; // Alpha
               continue;
           }

           // For inner pixels, gather neighbor values.
           let blackCount = 0;
           // A 3x3 grid has 9 pixels. We count the black ones.
           for (let ny = -1; ny <= 1; ny++) {
               for (let nx = -1; nx <= 1; nx++) {
                   const neighborIndex = ((y + ny) * width + (x + nx)) * 4;
                   // In a B&W image, we only need to check one channel (e.g., Red).
                   const pixelValue = srcData[neighborIndex];
                   if (pixelValue === 0) { // Black pixel
                       blackCount++;
                   }
               }
           }

           // The new color is the one with the majority count in the neighborhood.
           // If blackCount > 4 (i.e., 5 or more), black is the majority. Otherwise, white is.
           const newColor = blackCount > 4 ? 0 : 255;

           dstData[i] = newColor;
           dstData[i + 1] = newColor;
           dstData[i + 2] = newColor;
           dstData[i + 3] = 255; // Set full alpha.
       }
   }

   // Return a new ImageData object created from our destination buffer.
   return new ImageData(dstData, width, height);
};

// --- useEffect Hooks (Side Effects) ---

// This effect runs when the image is loaded or the control panel's visibility changes.
// It recalculates the canvas dimensions to ensure it's responsive.
useEffect(() => {
 if (imageLoaded) {
   calculateCanvasDimensions();
 }
}, [isControlsVisible, imageLoaded]);

// This is the core image processing effect. It runs whenever the source image or any conversion setting changes.
useEffect(() => {
 if (!image || !canvasRef.current || !imgRef.current || !imageLoaded || canvasWidth === 0 || canvasHeight === 0) return;
 
 const canvas = canvasRef.current;
 const ctx = canvas.getContext("2d", { willReadFrequently: true });
 if (!ctx) return;
 
 // 1. Draw the original image onto the canvas.
 const img = imgRef.current;
 canvas.width = canvasWidth;
 canvas.height = canvasHeight;
 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
 
 // 2. Get the pixel data from the canvas.
 let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
 let data = imageData.data;
 
 // 3. Prepare for color matching if in 'color' mode.
 let targetHsl = { h: 0, s: 0, l: 0 };
 if (conversionMode === 'color') {
   const targetHex = PREDEFINED_TARGETS[targetColorIndex].hex;
   const targetRgb = hexToRgb(targetHex);
   if (targetRgb) { targetHsl = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b); }
 }
 
 // 4. Iterate over every pixel and convert it to black or white based on the selected mode.
 for (let i = 0; i < data.length; i += 4) {
   let isMatch = false;
   if (conversionMode === 'brightness') {
     const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
     isMatch = avg < (brightnessThreshold / 100) * 255;
   } else { // 'color' mode
     const pixelHsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
     const hueDiff = Math.min(Math.abs(pixelHsl.h - targetHsl.h), 360 - Math.abs(pixelHsl.h - targetHsl.h));
     const satDiff = Math.abs(pixelHsl.s - targetHsl.s);
     const lightDiff = Math.abs(pixelHsl.l - targetHsl.l);
     isMatch = hueDiff <= hueTolerance && satDiff <= saturationTolerance && lightDiff <= lightnessTolerance;
   }
   // If it's a match (raised area), color it black (0). Otherwise, white (255).
   const colorValue = isMatch ? 0 : 255;
   data[i] = data[i + 1] = data[i + 2] = colorValue;
 }
 
 // 5. Apply the smoothing filter if it's enabled.
 let finalImageData = imageData;
 if (enableSmoothing) {
   finalImageData = applySmoothingFilter(imageData, canvas.width, canvas.height);
 }
 
 // 6. Put the final (potentially smoothed) pixel data back onto the canvas.
 ctx.putImageData(finalImageData, 0, 0);

}, [image, imageLoaded, canvasWidth, canvasHeight, conversionMode, brightnessThreshold, targetColorIndex, hueTolerance, saturationTolerance, lightnessTolerance, enableSmoothing]);

// This effect adds/removes a window resize event listener to make the canvas responsive.
useEffect(() => {
 if (imageLoaded) {
   window.addEventListener("resize", calculateCanvasDimensions);
   // Cleanup function: remove the listener when the component unmounts to prevent memory leaks.
   return () => window.removeEventListener("resize", calculateCanvasDimensions);
 }
}, [imageLoaded]);

// --- 3MF File Generation and Download ---

/**
* --- NEW ---
* Generates the XML content for a 3MF file with two separate, manifold (watertight) objects.
* One object is the base plate, and the other represents the raised details.
* @param {number[][]} heightmap - 2D array of pixel brightness (0 for black, 255 for white).
* @param {number} baseHeight - Thickness of the model's base (mm).
* @param {number} detailHeight - Height of the raised details above the base (mm).
* @param {string} raisedColorHex - HEX code for the raised color.
* @param {string} baseColorHex - HEX code for the base color.
* @returns {string | null} The full XML string for the 3dmodel.model file.
*/
const generate3mfXML_separateObjects = (heightmap: number[][], baseHeight: number, detailHeight: number, raisedColorHex: string, baseColorHex: string) => {
   if (!heightmap || heightmap.length === 0) return null;
   const h = heightmap.length;
   const w = heightmap[0].length;
   const pixelSize = 0.2; // Real-world size of one pixel in mm.

   // --- Part 1: Generate the Base Object (a simple box) ---
   const baseVertices = [
       { x: 0, y: 0, z: 0 },
       { x: w * pixelSize, y: 0, z: 0 },
       { x: w * pixelSize, y: h * pixelSize, z: 0 },
       { x: 0, y: h * pixelSize, z: 0 },
       { x: 0, y: 0, z: baseHeight },
       { x: w * pixelSize, y: 0, z: baseHeight },
       { x: w * pixelSize, y: h * pixelSize, z: baseHeight },
       { x: 0, y: h * pixelSize, z: baseHeight },
   ];
   const baseTriangles = [
       { v1: 0, v2: 1, v3: 2 }, { v1: 0, v2: 2, v3: 3 }, // Bottom face
       { v1: 4, v2: 6, v3: 5 }, { v1: 4, v2: 7, v3: 6 }, // Top face
       { v1: 0, v2: 4, v3: 1 }, { v1: 1, v2: 4, v3: 5 }, // Front wall
       { v1: 1, v2: 5, v3: 2 }, { v1: 2, v2: 5, v3: 6 }, // Right wall
       { v1: 2, v2: 6, v3: 3 }, { v1: 3, v2: 6, v3: 7 }, // Back wall
       { v1: 3, v2: 7, v3: 0 }, { v1: 0, v2: 7, v3: 4 }, // Left wall
   ];

   // --- Part 2: Generate the Raised Object (complex part) ---
   const raisedVertices: {x:number, y:number, z:number}[] = [];
   const raisedTriangles: {v1:number, v2:number, v3:number}[] = [];
   const vertexMap = new Map<string, number>();

   const getVertex = (x: number, y: number, z: number) => {
       const key = `${x},${y},${z}`;
       if (vertexMap.has(key)) {
           return vertexMap.get(key)!;
       }
       const index = raisedVertices.length;
       raisedVertices.push({ x: x * pixelSize, y: y * pixelSize, z });
       vertexMap.set(key, index);
       return index;
   };

   const topZ = baseHeight + detailHeight;
   const bottomZ = baseHeight;

   for (let y = 0; y < h; y++) {
       for (let x = 0; x < w; x++) {
           // We only care about black pixels, as they form the raised details.
           if (heightmap[y][x] === 0) {
               // Get indices for the 8 vertices of this pixel's "block".
               const v_tl_b = getVertex(x, y, bottomZ);         // Top-left, bottom
               const v_tr_b = getVertex(x + 1, y, bottomZ);     // Top-right, bottom
               const v_bl_b = getVertex(x, y + 1, bottomZ);     // Bottom-left, bottom
               const v_br_b = getVertex(x + 1, y + 1, bottomZ); // Bottom-right, bottom
               const v_tl_t = getVertex(x, y, topZ);            // Top-left, top
               const v_tr_t = getVertex(x + 1, y, topZ);        // Top-right, top
               const v_bl_t = getVertex(x, y + 1, topZ);        // Bottom-left, top
               const v_br_t = getVertex(x + 1, y + 1, topZ);    // Bottom-right, top

               // Add top face (always exists for a black pixel)
               raisedTriangles.push({ v1: v_tl_t, v2: v_tr_t, v3: v_bl_t });
               raisedTriangles.push({ v1: v_tr_t, v2: v_br_t, v3: v_bl_t });

               // Add bottom face (sits on the base)
               raisedTriangles.push({ v1: v_tl_b, v2: v_bl_b, v3: v_tr_b });
               raisedTriangles.push({ v1: v_tr_b, v2: v_bl_b, v3: v_br_b });

               // Check neighbors to add walls only at the boundary, ensuring a manifold mesh.
               // Wall on top of pixel (between y and y-1)
               if (y === 0 || heightmap[y - 1][x] === 255) {
                   raisedTriangles.push({ v1: v_tl_b, v2: v_tr_b, v3: v_tl_t });
                   raisedTriangles.push({ v1: v_tr_b, v2: v_tr_t, v3: v_tl_t });
               }
               // Wall below pixel (between y and y+1)
               if (y === h - 1 || heightmap[y + 1][x] === 255) {
                   raisedTriangles.push({ v1: v_bl_b, v2: v_bl_t, v3: v_br_b });
                   raisedTriangles.push({ v1: v_br_b, v2: v_bl_t, v3: v_br_t });
               }
               // Wall to the left of pixel (between x and x-1)
               if (x === 0 || heightmap[y][x - 1] === 255) {
                   raisedTriangles.push({ v1: v_tl_b, v2: v_tl_t, v3: v_bl_b });
                   raisedTriangles.push({ v1: v_bl_b, v2: v_tl_t, v3: v_bl_t });
               }
               // Wall to the right of pixel (between x and x+1)
               if (x === w - 1 || heightmap[y][x + 1] === 255) {
                   raisedTriangles.push({ v1: v_tr_b, v2: v_br_b, v3: v_tr_t });
                   raisedTriangles.push({ v1: v_br_b, v2: v_br_t, v3: v_tr_t });
               }
           }
       }
   }

   // --- Part 3: Assemble the XML ---
   const baseVerticesXML = baseVertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n');
   const baseTrianglesXML = baseTriangles.map(t => `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n');
   
   const raisedVerticesXML = raisedVertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n');
   const raisedTrianglesXML = raisedTriangles.map(t => `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n');
   
   // Note: The object IDs are now 2 and 3. Basematerials ID is 1.
   // The `pid` on the object tag assigns a default color to the whole mesh.
   return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
   <basematerials id="1">
     <base name="Raised Color" displaycolor="${raisedColorHex}" />
     <base name="Base Color" displaycolor="${baseColorHex}" />
   </basematerials>
   <object id="2" type="model" pid="1" pindex="1">
     <mesh>
       <vertices>${baseVerticesXML}</vertices>
       <triangles>${baseTrianglesXML}</triangles>
     </mesh>
   </object>
   <object id="3" type="model" pid="1" pindex="0">
     <mesh>
       <vertices>${raisedVerticesXML}</vertices>
       <triangles>${raisedTrianglesXML}</triangles>
     </mesh>
   </object>
 </resources>
 <build>
   <item objectid="2" />
   <item objectid="3" />
 </build>
</model>`;
};


/**
* Orchestrates the 3MF file download process.
*/
const download3MF = async () => {
 // 1. Get the heightmap data from the canvas.
 const heightmap = getHeightmap();
 if (!heightmap) { alert('Failed to generate heightmap.'); return; }
 
 // 2. Generate the model's XML using the new separate-object function.
 const modelXML = generate3mfXML_separateObjects(heightmap, baseHeight, detailHeight, PRINT_COLOR_RAISED, PRINT_COLOR_BASE);
 if (!modelXML) { alert('Failed to generate 3MF model data.'); return; }
 
 // 3. Create a .zip archive (which is what a .3mf file is) and add the necessary files.
 const zip = new JSZip();
 zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`);
 const relsFile = zip.folder("_rels");
 relsFile!.file(".rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`);
 const modelFile = zip.folder("3D");
 modelFile!.file("3dmodel.model", modelXML);
 
 // 4. Generate the zip file as a blob and create a download link.
 const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = 'multi-part-model.3mf';
 document.body.appendChild(link);
 link.click(); // Programmatically click the link to trigger the download.
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
};

// --- JSX Rendering ---
// This is what gets rendered to the screen.
return (
 <div className="flex flex-col items-center p-4 sm:p-6 space-y-6 w-full">
   {/* The file dropzone area */}
   <div {...getRootProps()} className={`w-full max-w-lg p-10 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-colors ${ isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}>
     <input {...getInputProps()} />
     <p className="text-sm text-gray-500">{image ? "Drag or click to upload a new image" : "Drag & drop or click to upload an image"}</p>
   </div>

   {/* A hidden image element. It's used as the source for drawing on the canvas but is not visible to the user. */}
   {image && <img ref={imgRef} src={image} alt="uploaded" className="hidden" onLoad={handleImageLoad} />}
   
   {/* This block is only rendered after an image has been uploaded. */}
   {image && (
     <div className="flex justify-center items-start w-full gap-6">
       {/* Left side: Canvas preview and action buttons */}
       <div className="flex flex-col items-center gap-4">
         {/* The visible canvas element. The processed image is drawn here. No rounded corners. */}
         <canvas ref={canvasRef} className="border shadow-lg" style={{ width: canvasWidth, height: canvasHeight }} />
         
         {/* Button to open the settings panel if it's closed */}
         {!isControlsVisible && imageLoaded && (
           <button onClick={() => setIsControlsVisible(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors animate-fade-in" aria-label="Open conversion settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             <span>Open Settings</span>
           </button>
         )}

         {/* Button to trigger the 3MF download */}
         {imageLoaded && (
           <button onClick={download3MF} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors animate-fade-in" aria-label="Export to 3MF">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-5l-4 4-4-4m1-5v7" /></svg>
             <span>Export Multi-Part (3MF)</span>
           </button>
         )}
       </div>
       
       {/* Right side: The settings panel, shown conditionally */}
       {isControlsVisible && (
         <div className="w-96 flex-shrink-0 p-6 bg-white rounded-2xl border shadow-lg space-y-6 animate-fade-in">
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-semibold text-gray-800">Conversion Settings</h3>
             <button onClick={() => setIsControlsVisible(false)} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors" aria-label="Close settings">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>

           {/* Conversion mode toggle buttons */}
           <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-lg">
             <button onClick={() => setConversionMode('brightness')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${conversionMode === 'brightness' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>By Brightness</button>
             <button onClick={() => setConversionMode('color')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${conversionMode === 'color' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>By Specific Color</button>
           </div>
           
           {/* Conditionally rendered settings based on the selected conversion mode */}
           {conversionMode === 'brightness' ? (
             // Settings for 'By Brightness' mode
             <div className="space-y-4 pt-4">
               <label htmlFor="brightnessThreshold" className="block text-sm font-medium text-gray-800">Brightness Cutoff: {brightnessThreshold}</label>
               <input id="brightnessThreshold" type="range" min="0" max="100" value={brightnessThreshold} onChange={(e) => setBrightnessThreshold(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
             </div>
           ) : (
             // Settings for 'By Specific Color' mode
             <div className="space-y-6 pt-4">
                 <div>
                   <label htmlFor="targetColor" className="block text-sm font-medium text-gray-800">Target Color: <span className="font-semibold">{PREDEFINED_TARGETS[targetColorIndex].name}</span></label>
                   <input id="targetColor" type="range" min="0" max={PREDEFINED_TARGETS.length - 1} value={targetColorIndex} onChange={(e) => setTargetColorIndex(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer mt-1"/>
                 </div>
                 
                 {/* Fine-tuning sliders for color matching, now with tooltips */}
                 <div className="border-t pt-5 space-y-4">
                      <h4 className="text-md font-semibold text-gray-700 text-center">Fine-Tune Selection</h4>
                      <div className="space-y-3">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                <label htmlFor="hueTolerance" className="text-sm font-medium text-gray-800">Hue Tolerance: {hueTolerance}</label>
                                <Tooltip text="Controls which shades of a color to include. A high value for 'green' will also include teal and lime." />
                              </div>
                              <input id="hueTolerance" type="range" min="0" max="180" value={hueTolerance} onChange={(e) => setHueTolerance(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                          </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <label htmlFor="saturationTolerance" className="text-sm font-medium text-gray-800">Saturation Tolerance: {saturationTolerance}</label>
                                <Tooltip text="Controls the color's vibrancy. A high value includes both neon, vibrant colors and dull, grayish colors." />
                              </div>
                              <input id="saturationTolerance" type="range" min="0" max="100" value={saturationTolerance} onChange={(e) => setSaturationTolerance(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                          </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <label htmlFor="lightnessTolerance" className="text-sm font-medium text-gray-800">Lightness Tolerance: {lightnessTolerance}</label>
                                <Tooltip text="Controls the color's brightness. A high value includes both light, pastel versions and dark, shadowy versions of the color." />
                              </div>
                              <input id="lightnessTolerance" type="range" min="0" max="100" value={lightnessTolerance} onChange={(e) => setLightnessTolerance(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                          </div>
                      </div>
                 </div>
             </div>
           )}
           
           {/* Section for 3D print physical dimensions and colors */}
           <div className="border-t pt-5">
              <h4 className="text-md font-semibold text-gray-700 text-center mb-4">3D Print Settings</h4>
              
              {/* Static color indicators to inform the user */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-2">
                   <span className="block w-8 h-8 rounded-md border border-gray-300" style={{backgroundColor: PRINT_COLOR_RAISED}}></span>
                   <span className="text-sm font-medium text-gray-800">Raised Detail</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="block w-8 h-8 rounded-md border border-gray-300" style={{backgroundColor: PRINT_COLOR_BASE}}></span>
                   <span className="text-sm font-medium text-gray-800">Base</span>
                 </div>
              </div>

              {/* User-editable inputs for model dimensions */}
              <div className="space-y-4 mt-6">
                  <div>
                      <label htmlFor="baseHeight" className="block text-sm font-medium text-gray-800 mb-1">
                          Base Thickness (mm)
                      </label>
                      <input 
                          id="baseHeight" 
                          type="number" 
                          step="0.1"
                          min="0.2"
                          value={baseHeight} 
                          onChange={(e) => setBaseHeight(Number(e.target.value))} 
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                  </div>
                  <div>
                      <label htmlFor="detailHeight" className="block text-sm font-medium text-gray-800 mb-1">
                          Detail Height (mm)
                      </label>
                      <input 
                          id="detailHeight" 
                          type="number" 
                          step="0.1"
                          min="0.1"
                          value={detailHeight} 
                          onChange={(e) => setDetailHeight(Number(e.target.value))} 
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                  </div>
              </div>
               {/* --- UI ELEMENT FOR SMOOTHING --- */}
               <div className="mt-6 border-t pt-5">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <label htmlFor="smoothing" className="text-sm font-medium text-gray-800">
                              Enable Smoothing Filter
                          </label>
                          <Tooltip text="Removes small, isolated dots of black or white to clean up the image. This helps create smoother surfaces for 3D printing." />
                      </div>
                      <input 
                          id="smoothing"
                          type="checkbox"
                          checked={enableSmoothing}
                          onChange={(e) => setEnableSmoothing(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                  </div>
              </div>
           </div>
         </div>
       )}
     </div>
   )}
 </div>
);
}
