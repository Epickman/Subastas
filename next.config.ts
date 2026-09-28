import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
  },
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
