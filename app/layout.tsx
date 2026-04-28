import type { Metadata } from "next";
import { Syne, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({ 
  subsets: ["latin"], 
  variable: "--font-syne",
  weight: ["400", "700", "800"]
});

const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-outfit",
  weight: ["400", "600", "700"]
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-jetbrains-mono",
  weight: ["400", "600", "700"]
});

export const metadata: Metadata = {
  title: "RadioBiz Pro | Dashboard",
  description: "Dashboard premium para la administración de clientes y radios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${syne.variable} ${outfit.variable} ${jetbrainsMono.variable} font-outfit`}>
        {/* Animated Mesh Gradient Background applied globally */}
        <div className="mesh-bg"></div>
        {children}
      </body>
    </html>
  );
}
