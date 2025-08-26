import "./globals.css";
import { ReactNode } from "react";
//import { Navbar } from "./components/Navbar"; // import the client component
import { Header } from './components/shared/Header';
import { Footer } from './components/shared/Footer';
import Providers from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your App",
  description: "Auth-enabled app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}