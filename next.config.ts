import type { NextConfig } from "next";
import { getBaselineSecurityHeaders } from './src/lib/security/http';

const nextConfig: NextConfig = {
  // Turbopack config removed to fix rendering crashes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: getBaselineSecurityHeaders(),
      },
    ];
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/.playwright-mcp/**', '**/.next-dev-*.log'],
    };

    return config;
  },
};

export default nextConfig;
