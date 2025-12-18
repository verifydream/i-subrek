import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev tunnel origins for mobile testing
  allowedDevOrigins: [
    "*.devtunnels.ms",
    "*.asse.devtunnels.ms",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.devtunnels.ms",
        "*.asse.devtunnels.ms",
      ],
    },
  },
};

export default nextConfig;
