"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useUser } from "../../hooks/useUser";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function Header() {
  const { items } = useCart();
  const { user, isLoading } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <KeyRound className="h-7 w-7 text-primary" />
          <span className="font-extrabold text-lg sm:text-xl text-gray-800">
            Keychain Forge
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-5">
          <Link
            href="/#features"
            className="text-sm font-medium text-gray-600 hover:text-primary transition"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-gray-600 hover:text-primary transition"
          >
            How It Works
          </Link>
          <Link
            href="/ImageConvertor"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-white text-sm font-semibold shadow hover:bg-primary/90 transition"
          >
            Create Now
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center hover:text-primary transition"
          >
            🛒
            {items.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </Link>

          {/* Auth */}
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : !user ? (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-primary transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-gray-600 hover:text-primary transition"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary transition"
              >
                <span>Hi, {user.name ?? user.email}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
