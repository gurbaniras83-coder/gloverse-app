import "./globals.css";
import { AuthProvider } from "@/context/auth-provider";
import { UploadProvider } from "@/context/upload-provider";
import { Toaster } from "@/components/ui/toaster";
import UploadProgressIndicator from "@/components/upload-progress-indicator";
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: "Gloverse",
  description: "Unleash Your Inner Star",
  manifest: "/manifest.json",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gloverse"
  },
  other: {
    'mobile-web-app-capable': 'yes'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f0f0f",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-white antialiased no-scrollbar" suppressHydrationWarning>
        <AuthProvider>
            <UploadProvider>
                <div key="root-layout-container" className="max-w-[480px] mx-auto min-h-dvh shadow-2xl border-x border-zinc-800 relative bg-background">
                    {children}
                </div>
                <Toaster />
                <UploadProgressIndicator />
            </UploadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
