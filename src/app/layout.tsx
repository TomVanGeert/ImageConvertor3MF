// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Make sure this is imported
import { Header } from './components/shared/Header';
import { Footer } from './components/shared/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
 title: 'Keychain Forge - Custom 3D Printed Keychains',
 description: 'Turn any image into a high-quality, full-color 3D printed keychain. The perfect personalized gift.',
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
   // The <html> and <body> tags must be structured like this,
   // with no comments or newlines between them.
   <html lang="en" className="dark" suppressHydrationWarning>
     <body className={`${inter.className} bg-background text-foreground`}>
       <div className="relative flex min-h-screen flex-col">
         <Header />
         <main className="flex-1">{children}</main>
         <Footer />
       </div>
     </body>
   </html>
 );
}
