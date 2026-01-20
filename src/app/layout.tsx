import "./globals.css";
import { AuthProvider } from "@/context/auth-provider";
import { UploadProvider } from "@/context/upload-provider";
import { Toaster } from "@/components/ui/toaster";
import UploadProgressIndicator from "@/components/upload-progress-indicator";

export const metadata = {
  title: "GloVerse",
  description: "Unleash Your Inner Star",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0f0f0f] text-white antialiased" suppressHydrationWarning>
        <AuthProvider>
            <UploadProvider>
                <div key="root-layout-container" className="max-w-[500px] mx-auto min-h-screen shadow-2xl border-x border-zinc-800 relative">
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
