import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#181209",
};

export const metadata: Metadata = {
  title: "Upstream Admin",
  description: "Internal platform admin: system health, streams, accounts, usage.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "rgba(24, 18, 9, 0.92)",
              border: "1px solid rgba(245, 241, 231, 0.14)",
              color: "var(--ink)",
              backdropFilter: "blur(22px) saturate(140%)",
            },
          }}
        />
      </body>
    </html>
  );
}
