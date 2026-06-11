import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import "./theme.css";
import { satoshi } from "./fonts";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1610",
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
        <div className={`${satoshi.variable} admin-panel`}>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: "#211a11",
                border: "1px solid rgba(217, 164, 65, 0.3)",
                color: "#f5f1e7",
              },
            }}
          />
        </div>
      </body>
    </html>
  );
}
