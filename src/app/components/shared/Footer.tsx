// src/app/components/shared/Footer.tsx
import Link from 'next/link';
import { KeyRound } from 'lucide-react';

export function Footer() {
 return (
   <footer className="border-t">
     <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 px-4 md:h-24 md:flex-row md:py-0">
       <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
         <KeyRound className="h-6 w-6" />
         <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
           Built by Keychain Forge. &copy; {new Date().getFullYear()} All Rights Reserved.
         </p>
       </div>
       <div className="flex items-center space-x-4">
         <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
         <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
       </div>
     </div>
   </footer>
 );
}
