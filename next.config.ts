import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/researchtool",
  reactCompiler: true,
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
