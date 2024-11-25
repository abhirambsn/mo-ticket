import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "resolute-emu-69.convex.cloud",
        protocol: "https",
      },
      {
        hostname: "brilliant-cassowary-899.convex.cloud",
        protocol: "https",
      }
    ]
  }
};

export default nextConfig;
