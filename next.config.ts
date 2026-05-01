import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config removed to fix rendering crashes
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/.playwright-mcp/**', '**/.next-dev-*.log'],
    };

    return config;
  },
};

export default nextConfig;
