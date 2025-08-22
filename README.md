# Image to Multi-Part 3D Model Converter

This is a web-based tool built with Next.js and React that converts a standard 2D image into a multi-part 3D model suitable for multi-color 3D printing. The application generates a `.3mf` file containing two separate, manifold (watertight) meshes: one for the base and one for the raised details. This structure allows for easy color assignment in modern 3D slicers like PrusaSlicer, Bambu Studio, or Cura.


<!-- TODO: Replace this with an actual screenshot of your app! -->

## ✨ Features

-   **Drag-and-Drop Upload:** Easily upload an image from your computer.
-   **Live Preview:** See a real-time preview of the black-and-white conversion as you adjust settings.
-   **Two Conversion Modes:**
   1.  **By Brightness:** Converts pixels to black or white based on a simple brightness threshold.
   2.  **By Specific Color:** Targets a specific color in the image (e.g., all greens) and allows fine-tuning with Hue, Saturation, and Lightness tolerance sliders.
-   **Noise Reduction Filter:** An optional smoothing filter (Median Filter) cleans up "salt-and-pepper" noise for smoother final prints.
-   **Customizable 3D Dimensions:** Set the exact thickness of the base and the height of the raised details in millimeters.
-   **Multi-Part 3MF Export:** Generates a single `.3mf` file containing two distinct objects, making it trivial to assign different filaments or extruders in your slicer.
-   **Fully Client-Side:** All processing is done in the browser. Your images are never uploaded to a server.
-   **Responsive Design:** Usable on both desktop and mobile devices.

## 🛠️ Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (React)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **File Upload:** [react-dropzone](https://react-dropzone.js.org/)
-   **3MF Generation:** [JSZip](https://stuk.github.io/jszip/) (for creating the `.zip` archive that is the `.3mf` format)

## 🚀 Getting Started

To run this project locally, you'll need [Node.js](https://nodejs.org/) (version 18.x or later recommended) and `npm` installed.

1. Clone the Repository

Clone this project to your local machine.

> git clone https://github.com/your-username/your-repo-name.git

> cd your-repo-name

2. Install Dependencies
Install the necessary project dependencies using npm.

> npm install

3. Run the Development Server
Start the Next.js development server.

> npm run dev

The application should now be running locally. Open your browser and navigate to http://localhost:3000.

### 📄 How to Use the Application
-   **Upload an Image:** Drag and drop an image file onto the designated area, or click to open a file selection dialog.
-   **Adjust Settings:** Once the image is loaded, a settings panel will appear on the right.
        Choose Conversion Mode: Select whether to convert the image based on overall Brightness or a Specific Color.
        Tune the Selection: Use the sliders to adjust the thresholds until the live preview on the left accurately represents the details you want to be raised.
        Set Print Dimensions: Enter the desired Base Thickness and Detail Height for your physical 3D model.
        (Optional) Toggle Smoothing: Enable or disable the Smoothing Filter to remove small artifacts. It is recommended to leave this on for cleaner prints.
-   **Export the Model:** When you are satisfied with the preview, click the "Export Multi-Part (3MF)" button.
-   **Slice and Print:**
        Your browser will download a multi-part-model.3mf file.
        Import this file into your 3D slicer (e.g., PrusaSlicer, Bambu Studio).
        The slicer will recognize the file contains two separate objects: "Base" and "Raised Detail".
        Assign your desired filament color or extruder to each part.
        Slice the model and send it to your 3D printer!

#### The project follows a component-based architecture for better organization and maintainability.

/app
├── components/         # Reusable React components
│   ├── CanvasPreview.tsx
│   ├── Dropzone.tsx
│   ├── SettingsPanel.tsx
│   └── ui/
│       └── Tooltip.tsx
├── hooks/              # Custom React hooks for logic abstraction
│   ├── useCanvasSizing.ts
│   └── useImageProcessor.ts
├── lib/                # Non-React helper functions, constants, and types
│   ├── constants.ts
│   ├── threeMFGenerator.ts
│   └── utils.ts
├── layout.tsx          # Root Next.js layout
└── page.tsx            # The main page component