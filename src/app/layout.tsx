import "./globals.css";
import { UploadProvider } from "@/context/upload-provider";

export const metadata = {
  title: "GloVerse",
  description: "Unleash Your Inner Star",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0f0f0f] text-white antialiased" suppressHydrationWarning>
        <UploadProvider>
          {/* ਸਾਰੀਆਂ ਚੀਜ਼ਾਂ ਨੂੰ ਇੱਕੋ ਡੱਬੇ ਵਿੱਚ ਪਾਉਣਾ ਜ਼ਰੂਰੀ ਹੈ */}
          <div key="root-layout-container" className="max-w-[500px] mx-auto min-h-screen shadow-2xl border-x border-zinc-800 relative">
            {children}
          </div>
        </UploadProvider>
      </body>
    </html>
  );
}
