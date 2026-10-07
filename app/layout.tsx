import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./components/SmoothScroll";
import { Navbar } from "./components/Navbar";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/lib/contexts/SessionContext";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora - Smart Hackathon Management",
  description: "Empowering the Next Wave of Tech Innovators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", inter.variable, playfair.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{const t=localStorage.getItem('nexora-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <Navbar />
          <SmoothScroll>{children}</SmoothScroll>
        </SessionProvider>
      </body>
    </html>
  );
}
