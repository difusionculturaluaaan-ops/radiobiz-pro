import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  experimental: {
    optimizePackageImports: ["firebase"],
  },
};

export default nextConfig;
