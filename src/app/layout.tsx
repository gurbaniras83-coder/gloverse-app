import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-provider";
import { UploadProvider } from "@/context/upload-provider";
import UploadProgressIndicator from "@/components/upload-progress-indicator";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Gloverse",
  description: "A professional YouTube mobile clone.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}
      >
        <AuthProvider>
          <UploadProvider>
            {children}
            <Toaster />
            <UploadProgressIndicator />
          </UploadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
