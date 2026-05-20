import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/researchtool",
  // reactCompiler: true, // disabled — causes OOM in dev mode
  experimental: {
    authInterrupts: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/researchtool",
        permanent: true,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
