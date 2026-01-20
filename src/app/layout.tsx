"use client";

import { useState, useEffect } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-provider";
import { UploadProvider } from "@/context/upload-provider";
import UploadProgressIndicator from "@/components/upload-progress-indicator";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Correctly check sessionStorage only on the client
    if (sessionStorage.getItem("splashShown")) {
      setShowSplash(false);
    } else {
        // If not shown, show it and then set the flag.
        const timer = setTimeout(() => {
            sessionStorage.setItem("splashShown", "true");
            setShowSplash(false);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, []);


  const handleSplashFinish = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };


  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>Gloverse</title>
        <meta name="description" content="Unleash Your Inner Star" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f0f0f" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <UploadProvider>
            {showSplash && <SplashScreen onFinished={handleSplashFinish} />}
            {children}
            <Toaster />
            <UploadProgressIndicator />
          </UploadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
