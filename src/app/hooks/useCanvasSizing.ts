// hooks/useCanvasSizing.ts
import { useState, useEffect, useCallback } from 'react';

// Define some padding so the canvas doesn't touch the screen edges.
const PADDING = 40;

/**
* A custom hook to calculate canvas dimensions. It provides two sets:
* 1.  `display`: Scaled to fit the user's screen.
* 2.  `original`: The full, natural resolution of the source image for exports.
*/
export function useCanvasSizing(
  imgRef: React.RefObject<HTMLImageElement | null>,
  imageLoaded: boolean,
) {
  const [displayWidth, setDisplayWidth] = useState(0);
  const [displayHeight, setDisplayHeight] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const updateCanvasSizes = useCallback(() => {
    if (imgRef.current && imageLoaded) {
      const img = imgRef.current;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // 1. Set the original dimensions directly from the image
      setOriginalWidth(naturalW);
      setOriginalHeight(naturalH);

      // 2. Calculate the display dimensions for the screen-fitted canvas
      const availableWidth = window.innerWidth - PADDING;
      const availableHeight = window.innerHeight - PADDING;
      const scale = Math.min(1, availableWidth / naturalW, availableHeight / naturalH);

      setDisplayWidth(Math.round(naturalW * scale));
      setDisplayHeight(Math.round(naturalH * scale));
    }
  }, [imgRef, imageLoaded]);

  useEffect(() => {
    updateCanvasSizes();
    window.addEventListener('resize', updateCanvasSizes);
    return () => window.removeEventListener('resize', updateCanvasSizes);
  }, [updateCanvasSizes]);

  return {
    displayWidth,
    displayHeight,
    originalWidth,
    originalHeight,
  };
}
