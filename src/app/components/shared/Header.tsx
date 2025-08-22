// src/app/components/shared/Header.tsx
import Link from 'next/link';
import { KeyRound } from 'lucide-react';

export function Header() {
 return (
   <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
     <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
       <Link href="/" className="flex items-center space-x-2">
         <KeyRound className="h-6 w-6 text-primary" />
         <span className="font-bold sm:inline-block">Keychain Forge</span>
       </Link>
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
       </nav>
     </div>
   </header>
 );
}
