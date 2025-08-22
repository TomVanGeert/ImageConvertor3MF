// ImageConverterPage.tsx
'use client';

// --- React and Library Imports ---
import React, { useState, useRef, useEffect } from "react";
import JSZip from 'jszip';

// --- Component Imports ---
import Dropzone from "./components/Dropzone";
import CanvasPreview from "./components/CanvasPreview";
import SettingsPanel from "./components/SettingsPanel";

// --- Hook Imports ---
import { useCanvasSizing } from "./hooks/useCanvasSizing";
import { useImageProcessor } from "./hooks/useImageProcessor";

// --- Utility and Type Imports ---
import { generateBambu3mf } from "./lib/threeMFGeneratorBambu";
import { PREDEFINED_TARGETS } from "./lib/constants";
import { Settings } from "./lib/types";

// --- CONFIGURATION CONSTANT ---
// Set the maximum dimension (width or height) for the image processing.
// This directly impacts the resolution and detail of the final 3D model.
// - Lower values (e.g., 512) are much faster to process and export.
// - Higher values (e.g., 2048) are more detailed but can be very slow.
const PROCESSING_RESOLUTION = 1024;

export default function ImageConverterPage() {
  // --- State Management ---
  const [image, setImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isControlsVisible, setIsControlsVisible] = useState(false);

  // Settings state no longer includes processingResolution
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
    useWidthInput: true
  });

  // State for the calculated processing dimensions, derived from the constant above
  const [processingWidth, setProcessingWidth] = useState(0);
  const [processingHeight, setProcessingHeight] = useState(0);

  // --- Refs ---
  const imgRef = useRef<HTMLImageElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Custom Hooks ---
  const { displayWidth, displayHeight, originalWidth, originalHeight } = useCanvasSizing(imgRef, imageLoaded);
  const processedImageData = useImageProcessor(
    imgRef,
    imageLoaded,
    processingWidth,
    processingHeight,
    settings
  );

  // --- Effect to calculate processing dimensions based on the constant ---
  useEffect(() => {
    if (!imageLoaded || !originalWidth || !aspectRatio) return;

    // If the image is already smaller than the target resolution, use its original size to avoid upscaling
    if (Math.max(originalWidth, originalHeight) <= PROCESSING_RESOLUTION) {
      setProcessingWidth(originalWidth);
      setProcessingHeight(originalHeight);
      return;
    }

    // Otherwise, scale it down to the target resolution while maintaining aspect ratio
    if (aspectRatio > 1) { // Landscape image
      setProcessingWidth(PROCESSING_RESOLUTION);
      setProcessingHeight(Math.round(PROCESSING_RESOLUTION / aspectRatio));
    } else { // Portrait or square image
      setProcessingHeight(PROCESSING_RESOLUTION);
      setProcessingWidth(Math.round(PROCESSING_RESOLUTION * aspectRatio));
    }
  }, [imageLoaded, originalWidth, originalHeight, aspectRatio]);

  // --- Effect to draw processed data to both canvases ---
  useEffect(() => {
    const displayCanvas = displayCanvasRef.current;
    const exportCanvas = exportCanvasRef.current;
    if (!processedImageData || !displayCanvas || !exportCanvas) return;

    // 1. Draw to the hidden, full-resolution export canvas
    const exportCtx = exportCanvas.getContext('2d');
    if (exportCtx) {
      exportCanvas.width = processingWidth;
      exportCanvas.height = processingHeight;
      exportCtx.putImageData(processedImageData, 0, 0);
    }

    // 2. Draw a scaled version to the visible display canvas
    const displayCtx = displayCanvas.getContext('2d');
    if (displayCtx) {
      createImageBitmap(processedImageData).then(bitmap => {
        if (displayCanvasRef.current) {
          const currentDisplayCanvas = displayCanvasRef.current;
          currentDisplayCanvas.width = displayWidth;
          currentDisplayCanvas.height = displayHeight;
          const ctx = currentDisplayCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, displayWidth, displayHeight);
            ctx.drawImage(bitmap, 0, 0, displayWidth, displayHeight);
          }
        }
      });
    }
  }, [processedImageData, displayWidth, displayHeight, processingWidth, processingHeight]);

  // --- Event Handlers ---
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
  }, [aspectRatio, imageLoaded]);

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleExport3MF = async () => {
    if (!exportCanvasRef.current || !processingWidth) {
      alert("Export canvas is not ready. Please wait for the image to process.");
      return;
    }
    setIsExporting(true);
    try {
      const ctx = exportCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("Could not get canvas context for export.");

      const imageData = ctx.getImageData(0, 0, processingWidth, processingHeight);

      const heightmap: number[][] = [];
      for (let y = 0; y < processingHeight; y++) {
        heightmap[y] = [];
        for (let x = 0; x < processingWidth; x++) {
          heightmap[y][x] = imageData.data[(y * processingWidth + x) * 4];
        }
      }

      const archiveContent = generateBambu3mf(
        heightmap,
        { baseHeight: settings.baseHeight, detailHeight: settings.detailHeight },
        { width: settings.targetWidthMm, height: settings.targetHeightMm }
      );
      if (!archiveContent) throw new Error("Failed to generate 3MF model data.");

      const zip = new JSZip();
      for (const [filePath, fileContent] of Object.entries(archiveContent)) {
        zip.file(filePath, fileContent);
      }
      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.ms-pki.3dmanufacturing",
        compression: "DEFLATE"
      });
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
            />
            {/* This hidden canvas is now sized to the PROCESSING_RESOLUTION */}
            <canvas
              ref={exportCanvasRef}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>

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
