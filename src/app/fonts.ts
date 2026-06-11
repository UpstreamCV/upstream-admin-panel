import localFont from "next/font/local";

// Satoshi (self-hosted, Fontshare — see fonts/FFL.txt for the license).
// Same files and config as upstream-dashboard's src/app/dashboard/fonts.ts;
// applied app-wide here via the `.admin-panel` scope in the root layout.
export const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});
