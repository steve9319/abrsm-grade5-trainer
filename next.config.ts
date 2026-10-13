import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./data/questions/**/*.json"],
  },
};

export default nextConfig;
