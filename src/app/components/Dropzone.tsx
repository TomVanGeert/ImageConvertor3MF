'use client';

import { useDropzone, DropzoneOptions } from "react-dropzone";

interface DropzoneProps {
  onDrop: DropzoneOptions['onDrop'];
}

/**
* A reusable file dropzone component.
* @param {DropzoneProps} props - The component props.
* @param {Function} props.onDrop - Callback function to handle dropped files.
*/
export default function Dropzone({ onDrop }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`w-full max-w-lg p-10 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
    >
      <input {...getInputProps()} />
      <p className="text-gray-600">
        {isDragActive
          ? "Drop the image here..."
          : "Drag & drop an image here, or click to select"}
      </p>
    </div>
  );
}
