// hooks/useImageProcessor.ts
'use client';

import { useState, useEffect, RefObject } from 'react';
import { rgbToHsl, hexToRgb } from '../lib/utils';
import { PREDEFINED_TARGETS } from '../lib/constants';
import { Settings } from '../lib/types';

function applySmoothingFilter(imageData: ImageData, width: number, height: number): ImageData {
    const srcData = imageData.data;
    const dstData = new Uint8ClampedArray(srcData.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                dstData[i] = srcData[i]; dstData[i + 1] = srcData[i + 1]; dstData[i + 2] = srcData[i + 2]; dstData[i + 3] = srcData[i + 3];
                continue;
            }
            let blackCount = 0;
            for (let ny = -1; ny <= 1; ny++) {
                for (let nx = -1; nx <= 1; nx++) {
                    if (srcData[((y + ny) * width + (x + nx)) * 4] === 0) blackCount++;
                }
            }
            const newColor = blackCount > 4 ? 0 : 255;
            dstData[i] = newColor; dstData[i + 1] = newColor; dstData[i + 2] = newColor; dstData[i + 3] = 255;
        }
    }
    return new ImageData(dstData, width, height);
};

/**
* Processes an image based on settings and returns the resulting ImageData.
* It performs all operations on an in-memory canvas at a specific processing resolution.
*/
export function useImageProcessor(
    imgRef: RefObject<HTMLImageElement | null>,
    imageLoaded: boolean,
    processingWidth: number,
    processingHeight: number,
    settings: Omit<Settings, 'processingResolution'> // Note: The setting is no longer passed in
): ImageData | null {
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const { conversionMode, brightnessThreshold, targetColorIndex, hueTolerance, saturationTolerance, lightnessTolerance, enableSmoothing } = settings;

    useEffect(() => {
        if (!imageLoaded || !imgRef.current || processingWidth === 0 || processingHeight === 0) {
            setProcessedImageData(null);
            return;
        }

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = processingWidth;
        offscreenCanvas.height = processingHeight;
        const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        // Draw the original image scaled down to the processing resolution
        ctx.drawImage(imgRef.current, 0, 0, processingWidth, processingHeight);

        let imageData = ctx.getImageData(0, 0, processingWidth, processingHeight);
        let data = imageData.data;

        let targetHsl = { h: 0, s: 0, l: 0 };
        if (conversionMode === 'color') {
            const targetRgb = hexToRgb(PREDEFINED_TARGETS[targetColorIndex].hex);
            if (targetRgb) { targetHsl = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b); }
        }

        for (let i = 0; i < data.length; i += 4) {
            let isMatch = false;
            if (conversionMode === 'brightness') {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                isMatch = avg < (brightnessThreshold / 100) * 255;
            } else {
                const pixelHsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
                const hueDiff = Math.min(Math.abs(pixelHsl.h - targetHsl.h), 360 - Math.abs(pixelHsl.h - targetHsl.h));
                const satDiff = Math.abs(pixelHsl.s - targetHsl.s);
                const lightDiff = Math.abs(pixelHsl.l - targetHsl.l);
                isMatch = hueDiff <= hueTolerance && satDiff <= saturationTolerance && lightDiff <= lightnessTolerance;
            }
            const colorValue = isMatch ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = colorValue;
        }

        let finalImageData = imageData;
        if (enableSmoothing) {
            finalImageData = applySmoothingFilter(imageData, processingWidth, processingHeight);
        }

        setProcessedImageData(finalImageData);

    }, [imageLoaded, imgRef, processingWidth, processingHeight, settings]);

    return processedImageData;
}
