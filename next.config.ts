import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Rewrite `lucide-react` named imports to per-icon module paths so only
    // the icons actually used are bundled (same hardening as the dashboard).
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
