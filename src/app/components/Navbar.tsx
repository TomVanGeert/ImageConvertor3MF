'use client';

import Link from "next/link";
import { useCart } from "../hooks/useCart";

export default function Navbar() {
  const { items } = useCart();

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600">
          Image Keychains
        </Link>

        <div className="flex items-center space-x-6">
          <Link href="/ImageConvertor" className="hover:text-blue-600">
            Convert Image
          </Link>
          <Link href="/cart" className="relative flex items-center hover:text-blue-600">
            🛒
            {items.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
