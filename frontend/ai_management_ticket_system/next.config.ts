import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* your existing config options here */

  turbopack: {
    root: process.cwd(), // 👈 explicitly set the project root
  },
};

export default nextConfig;
