'use client';

import React, { useState, useRef, useEffect } from "react";
import JSZip from 'jszip';
import Dropzone from "../components/Dropzone";
import CanvasPreview from "../components/CanvasPreview";
import SettingsPanel from "../components/SettingsPanel";
import { useCanvasSizing } from "../hooks/useCanvasSizing";
import { useImageProcessor } from "../hooks/useImageProcessor";
import { generateBambu3mf } from "../lib/threeMFGeneratorBambu";
import { PREDEFINED_TARGETS } from "../lib/constants";
import { Settings, HolePosition } from "../lib/types";
import { useCart } from "../hooks/useCart";
import { v4 as uuidv4 } from "uuid";

const PROCESSING_RESOLUTION = 1024;

// Punch hole helper (unchanged)
const punchHoleInHeightmap = (
  heightmap: number[][],
  settings: {
    holePosition: HolePosition;
    holeDiameterMm: number;
    targetWidthMm: number;
  }
): number[][] => {
  if (settings.holePosition === 'none') return heightmap;

  const height = heightmap.length;
  if (height === 0) return heightmap;
  const width = heightmap[0].length;
  if (width === 0) return heightmap;

  const pixelPerMm = width / settings.targetWidthMm;
  const holeRadiusPx = (settings.holeDiameterMm / 2) * pixelPerMm;
  const paddingPx = 3 * pixelPerMm;

  let centerX: number;
  const centerY = paddingPx + holeRadiusPx;

  switch (settings.holePosition) {
    case 'top-left': centerX = paddingPx + holeRadiusPx; break;
    case 'top-right': centerX = width - paddingPx - holeRadiusPx; break;
    case 'top-middle':
    default: centerX = width / 2; break;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (distance <= holeRadiusPx) heightmap[y][x] = -1;
    }
  }

  return heightmap;
};

export default function ImageConverterPage() {
  // --- State & refs ---
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
  const [keychainName, setKeychainName] = useState("Custom Keychain");
  const [price, setPrice] = useState(1000); // €10 in cents

  const imgRef = useRef<HTMLImageElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  const { displayWidth, displayHeight, originalWidth, originalHeight } = useCanvasSizing(imgRef, imageLoaded);
  const processedImageData = useImageProcessor(imgRef, imageLoaded, processingWidth, processingHeight, settings);

  const { addItem, items, clear } = useCart();

  // --- Canvas sizing ---
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

  // --- Draw hole visualizer ---
  const drawHoleVisualizer = (ctx: CanvasRenderingContext2D, canvasW: number, modelW: number, holePos: HolePosition, holeDia: number) => {
    if (!canvasW || !modelW) return;
    const pixelPerMm = canvasW / modelW;
    const holeRadiusPx = (holeDia / 2) * pixelPerMm;
    const paddingPx = 3 * pixelPerMm;

    let cx: number;
    const cy = paddingPx + holeRadiusPx;

    switch (holePos) {
      case 'top-left': cx = paddingPx + holeRadiusPx; break;
      case 'top-right': cx = canvasW - paddingPx - holeRadiusPx; break;
      case 'top-middle':
      default: cx = canvasW / 2; break;
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

  // --- Centralized drawing ---
  useEffect(() => {
    const displayCanvas = displayCanvasRef.current;
    const exportCanvas = exportCanvasRef.current;
    if (!processedImageData || !displayCanvas || !exportCanvas) return;

    const exportCtx = exportCanvas.getContext('2d');
    if (exportCtx) {
      exportCanvas.width = processingWidth;
      exportCanvas.height = processingHeight;
      exportCtx.putImageData(processedImageData, 0, 0);
    }

    const displayCtx = displayCanvas.getContext('2d');
    if (displayCtx) {
      createImageBitmap(processedImageData).then(bitmap => {
        if (!displayCanvasRef.current) return;
        const currentDisplayCanvas = displayCanvasRef.current;
        currentDisplayCanvas.width = displayWidth;
        currentDisplayCanvas.height = displayHeight;
        const ctx = currentDisplayCanvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        ctx.drawImage(bitmap, 0, 0, displayWidth, displayHeight);
        if (settings.holePosition !== 'none') {
          drawHoleVisualizer(ctx, displayWidth, settings.targetWidthMm, settings.holePosition, settings.holeDiameterMm);
        }
      });
    }
  }, [processedImageData, displayWidth, displayHeight, settings]);

  // --- Dropzone / Image load handlers ---
  const handleDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setImageLoaded(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoad = () => {
    if (!imgRef.current) return;
    const imgWidth = imgRef.current.naturalWidth;
    const imgHeight = imgRef.current.naturalHeight;
    setAspectRatio(imgWidth / imgHeight);
    setImageLoaded(true);
    setIsControlsVisible(true);
  };

  useEffect(() => {
    if (!imageLoaded) return;
    if (settings.useWidthInput) {
      setSettings(s => ({ ...s, targetHeightMm: s.targetWidthMm / aspectRatio }));
    } else {
      setSettings(s => ({ ...s, targetWidthMm: s.targetHeightMm * aspectRatio }));
    }
  }, [aspectRatio, imageLoaded, settings.targetWidthMm, settings.targetHeightMm, settings.useWidthInput]);

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // --- Export 3MF ---
  const handleExport3MF = async () => {
    if (!exportCanvasRef.current || !processingWidth) return alert("Canvas not ready");
    setIsExporting(true);
    try {
      const ctx = exportCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("Could not get canvas context");
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
      if (!archiveContent) throw new Error("Failed to generate 3MF");
      const zip = new JSZip();
      for (const [filePath, fileContent] of Object.entries(archiveContent)) zip.file(filePath, fileContent);
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
      console.error(error);
      alert("Export failed");
    } finally { setIsExporting(false); }
  };

  // --- Add to cart ---
  const handleAddToCart = () => {
    if (!exportCanvasRef.current) return alert("Generate keychain first");
    const previewUrl = exportCanvasRef.current.toDataURL("image/png");
    addItem({
      id: uuidv4(),
      name: keychainName,
      price,
      quantity: 1,
      previewUrl,
      imageUrl: previewUrl,
    });
  };

  // --- Checkout all cart items ---
  const handleCheckout = async () => {
    if (items.length === 0) return alert("Cart is empty");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Checkout failed");
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
  };

  return (
    <main className="flex flex-col items-center p-4 sm:p-6 space-y-6 w-full">
      <h1 className="text-3xl font-bold text-gray-800">Image to 3D Model Converter</h1>

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
            <canvas ref={exportCanvasRef} style={{ display: 'none' }} aria-hidden="true" />
          </div>

          {isControlsVisible && (
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              predefinedColors={PREDEFINED_TARGETS.map(target => ({ label: target.name, color: target.hex }))}
              onClose={() => setIsControlsVisible(false)}
              aspectRatio={aspectRatio}
            />
          )}
        </div>
      )}

      {image && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <input
            type="text"
            value={keychainName}
            onChange={(e) => setKeychainName(e.target.value)}
            placeholder="Keychain name"
            className="border px-2 py-1 rounded w-64"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded"
            >
              Add to Cart
            </button>
            <button
              onClick={handleCheckout}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded"
            >
              Checkout All
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
