// src/app/ImageConvertor/page.tsx

'use client';

// --- (Keep all imports the same) ---
import React, { useState, useRef, useEffect } from "react";
import JSZip from 'jszip';
import Dropzone from "./components/Dropzone";
import CanvasPreview from "./components/CanvasPreview";
import SettingsPanel from "./components/SettingsPanel";
import { useCanvasSizing } from "./hooks/useCanvasSizing";
import { useImageProcessor } from "./hooks/useImageProcessor";
import { generateBambu3mf } from "./lib/threeMFGeneratorBambu";
import { PREDEFINED_TARGETS } from "./lib/constants";
import { Settings, HolePosition } from "./lib/types";


// --- (Keep punchHoleInHeightmap helper function the same) ---
const punchHoleInHeightmap = (
  heightmap: number[][],
  settings: {
    holePosition: HolePosition;
    holeDiameterMm: number;
    targetWidthMm: number;
  }
): number[][] => {
  if (settings.holePosition === 'none') {
    return heightmap;
  }

  const height = heightmap.length;
  if (height === 0) return heightmap;
  const width = heightmap[0].length;
  if (width === 0) return heightmap;

  const pixelPerMm = width / settings.targetWidthMm;
  const holeRadiusPx = (settings.holeDiameterMm / 2) * pixelPerMm;
  const paddingPx = 3 * pixelPerMm; // 3mm padding from the edge

  let centerX: number;
  const centerY = paddingPx + holeRadiusPx;

  switch (settings.holePosition) {
    case 'top-left':
      centerX = paddingPx + holeRadiusPx;
      break;
    case 'top-right':
      centerX = width - paddingPx - holeRadiusPx;
      break;
    case 'top-middle':
    default:
      centerX = width / 2;
      break;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (distance <= holeRadiusPx) {
        // --- THIS IS THE CRITICAL CHANGE ---
        // Instead of setting to 0, use -1 to signal a true hole.
        heightmap[y][x] = -1;
      }
    }
  }

  return heightmap;
};

const PROCESSING_RESOLUTION = 1024;

export default function ImageConverterPage() {
  // --- (Keep all state and refs the same, including new settings defaults) ---
  const [image, setImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [settings, setSettings] = useState<Omit<Settings, 'processingResolution'>>({
    conversionMode: 'brightness',
    brightnessThreshold: 50,
    targetColorIndex: 0,
    hueTolerance: 30,
    saturationTolerance: 50,
    lightnessTolerance: 50,
    enableSmoothing: true,
    baseHeight: 1.0,
    detailHeight: 0.2,
    targetWidthMm: 100,
    targetHeightMm: 100,
    useWidthInput: true,
    holePosition: 'none',
    holeDiameterMm: 5,
  });
  const [processingWidth, setProcessingWidth] = useState(0);
  const [processingHeight, setProcessingHeight] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const { displayWidth, displayHeight, originalWidth, originalHeight } = useCanvasSizing(imgRef, imageLoaded);
  const processedImageData = useImageProcessor(imgRef, imageLoaded, processingWidth, processingHeight, settings);

  // --- (Keep useEffect for processing dimensions) ---
  useEffect(() => {
    if (!imageLoaded || !originalWidth || !aspectRatio) return;
    if (Math.max(originalWidth, originalHeight) <= PROCESSING_RESOLUTION) {
      setProcessingWidth(originalWidth);
      setProcessingHeight(originalHeight);
      return;
    }
    if (aspectRatio > 1) {
      setProcessingWidth(PROCESSING_RESOLUTION);
      setProcessingHeight(Math.round(PROCESSING_RESOLUTION / aspectRatio));
    } else {
      setProcessingHeight(PROCESSING_RESOLUTION);
      setProcessingWidth(Math.round(PROCESSING_RESOLUTION * aspectRatio));
    }
  }, [imageLoaded, originalWidth, originalHeight, aspectRatio]);


  // --- START: NEW CENTRALIZED DRAWING LOGIC ---

  const drawHoleVisualizer = (
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    modelW: number,
    holePos: HolePosition,
    holeDia: number
  ) => {
    if (!canvasW || !modelW) return;

    const pixelPerMm = canvasW / modelW;
    const holeRadiusPx = (holeDia / 2) * pixelPerMm;
    const paddingPx = 3 * pixelPerMm; // 3mm padding from the edge

    let cx: number;
    const cy = paddingPx + holeRadiusPx;

    switch (holePos) {
      case 'top-left':
        cx = paddingPx + holeRadiusPx;
        break;
      case 'top-right':
        cx = canvasW - paddingPx - holeRadiusPx;
        break;
      case 'top-middle':
      default:
        cx = canvasW / 2;
        break;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, holeRadiusPx, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // This effect now handles ALL drawing on the display canvas
  useEffect(() => {
    const displayCanvas = displayCanvasRef.current;
    const exportCanvas = exportCanvasRef.current;
    if (!processedImageData || !displayCanvas || !exportCanvas) return;

    // 1. Draw to the hidden, full-resolution export canvas (unchanged)
    const exportCtx = exportCanvas.getContext('2d');
    if (exportCtx) {
      exportCanvas.width = processingWidth;
      exportCanvas.height = processingHeight;
      exportCtx.putImageData(processedImageData, 0, 0);
    }

    // 2. Draw everything to the visible display canvas
    const displayCtx = displayCanvas.getContext('2d');
    if (displayCtx) {
      createImageBitmap(processedImageData).then(bitmap => {
        if (displayCanvasRef.current) { // Check ref is still valid
          const currentDisplayCanvas = displayCanvasRef.current;
          currentDisplayCanvas.width = displayWidth;
          currentDisplayCanvas.height = displayHeight;
          const ctx = currentDisplayCanvas.getContext('2d');
          if (ctx) {
            // Step A: Clear the canvas
            ctx.clearRect(0, 0, displayWidth, displayHeight);
            // Step B: Draw the processed image
            ctx.drawImage(bitmap, 0, 0, displayWidth, displayHeight);
            // Step C: If a hole is selected, draw the visualizer on top
            if (settings.holePosition !== 'none') {
              drawHoleVisualizer(
                ctx,
                displayWidth,
                settings.targetWidthMm,
                settings.holePosition,
                settings.holeDiameterMm
              );
            }
          }
        }
      });
    }
    // Add `settings` to dependency array to re-run on any setting change
  }, [processedImageData, displayWidth, displayHeight, processingWidth, processingHeight, settings]);

  // --- END: NEW CENTRALIZED DRAWING LOGIC ---


  // --- (Keep all event handlers: handleDrop, handleImageLoad, etc.) ---
  // ... (no changes needed in the handler functions themselves) ...
  const handleDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setImageLoaded(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = () => {
    if (imgRef.current) {
      const imgWidth = imgRef.current.naturalWidth;
      const imgHeight = imgRef.current.naturalHeight;
      setAspectRatio(imgWidth / imgHeight);
      setImageLoaded(true);
      setIsControlsVisible(true);
    }
  };

  useEffect(() => {
    if (imageLoaded) {
      if (settings.useWidthInput) {
        setSettings(s => ({ ...s, targetHeightMm: s.targetWidthMm / aspectRatio }));
      } else {
        setSettings(s => ({ ...s, targetWidthMm: s.targetHeightMm * aspectRatio }));
      }
    }
  }, [aspectRatio, imageLoaded, settings.targetWidthMm, settings.targetHeightMm, settings.useWidthInput]); // Make dependencies more specific

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleExport3MF = async () => {
    // (This function remains unchanged and will work correctly)
    if (!exportCanvasRef.current || !processingWidth) {
      alert("Export canvas is not ready. Please wait for the image to process.");
      return;
    }
    setIsExporting(true);
    try {
      const ctx = exportCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("Could not get canvas context for export.");
      const imageData = ctx.getImageData(0, 0, processingWidth, processingHeight);
      let heightmap: number[][] = [];
      for (let y = 0; y < processingHeight; y++) {
        heightmap[y] = [];
        for (let x = 0; x < processingWidth; x++) {
          heightmap[y][x] = imageData.data[(y * processingWidth + x) * 4];
        }
      }
      const modifiedHeightmap = punchHoleInHeightmap(heightmap, {
        holePosition: settings.holePosition,
        holeDiameterMm: settings.holeDiameterMm,
        targetWidthMm: settings.targetWidthMm,
      });
      const archiveContent = generateBambu3mf(
        modifiedHeightmap,
        { baseHeight: settings.baseHeight, detailHeight: settings.detailHeight },
        { width: settings.targetWidthMm, height: settings.targetHeightMm }
      );
      if (!archiveContent) throw new Error("Failed to generate 3MF model data.");
      const zip = new JSZip();
      for (const [filePath, fileContent] of Object.entries(archiveContent)) {
        zip.file(filePath, fileContent);
      }
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.ms-pki.3dmanufacturing", compression: "DEFLATE" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bambu-studio-model.3mf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <main className="flex flex-col items-center p-4 sm:p-6 space-y-6 w-full">
      <h1 className="text-3xl font-bold text-gray-800">Image to 3D Model Converter</h1>
      <p className="text-center text-gray-600 max-w-2xl">
        Upload an image, adjust the settings, and export a multi-part 3MF file for 3D printing.
      </p>

      {image && <img ref={imgRef} src={image} alt="uploaded content" className="hidden" onLoad={handleImageLoad} />}
      {!image && <Dropzone onDrop={handleDrop} />}

      {image && (
        <div className="flex flex-col md:flex-row justify-center items-start w-full max-w-6xl gap-6">
          <div className="flex-shrink-0">
            <CanvasPreview
              ref={displayCanvasRef}
              canvasWidth={displayWidth}
              canvasHeight={displayHeight}
              isControlsVisible={isControlsVisible}
              imageLoaded={imageLoaded}
              isExporting={isExporting}
              onOpenSettings={() => setIsControlsVisible(true)}
              onExport={handleExport3MF}
            // --- REMOVED hole visualization props ---
            />
            {/* Hidden canvas remains the same */}
            <canvas
              ref={exportCanvasRef}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>

          {/* SettingsPanel call remains the same */}
          {isControlsVisible && (
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              predefinedColors={PREDEFINED_TARGETS.map(target => ({
                label: target.name,
                color: target.hex
              }))}
              onClose={() => setIsControlsVisible(false)}
              aspectRatio={aspectRatio}
            />
          )}
        </div>
      )}
    </main>
  );
}
