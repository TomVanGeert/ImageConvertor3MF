// app/lib/utils.ts

/**
* Converts a HEX color string (e.g., #FF33AA) to an RGB object.
* @param {string} hex - The hex color string.
* @returns {{r: number, g: number, b: number} | null} - An object with r, g, b values or null if invalid.
*/
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
};

/**
* Converts RGB color values to HSL (Hue, Saturation, Lightness) values.
* HSL is useful for comparing colors in a more human-perceptive way.
* @param {number} r - Red value (0-255).
* @param {number} g - Green value (0-255).
* @param {number} b - Blue value (0-255).
* @returns {{h: number, s: number, l: number}} - An object with h, s, l values.
*/
export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        h: h * 360,
        s: s * 100,
        l: l * 100,
    };
};
