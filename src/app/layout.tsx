import "./globals.css";
import { ReactNode } from "react";
//import { Navbar } from "./components/Navbar"; // import the client component
import { Header } from './components/shared/Header';
import { Footer } from './components/shared/Footer';

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en">
//       <body className="min-h-screen bg-gray-50">
//         <Navbar />
//         <main className="max-w-6xl mx-auto p-6">{children}</main>
//       </body>
//     </html>
//   );
// }
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}