'use client';

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useUser } from "../../hooks/useUser";

export function Header() {
  const { items } = useCart();
  const { user, loading, logout } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <KeyRound className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">Keychain Forge</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-4">
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            How It Works
          </Link>
          <Link
            href="/ImageConvertor"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Create Now
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative flex items-center ml-4 hover:text-primary">
            🛒
            {items.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </Link>

          {/* Authentication */}
          {loading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : !user ? (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">Hi, {user.name}</span>
              <button
                onClick={logout}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
