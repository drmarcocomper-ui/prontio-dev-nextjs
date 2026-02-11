import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "friendly-guide-97r947pxv75w3p5r4-3000.app.github.dev",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "friendly-guide-97r947pxv75w3p5r4-3000.app.github.dev",
      ],
    },
  },
};

export default nextConfig;
