import type { NextConfig } from "next";

const nextConfig: NextConfig & { serverActions?: { bodySizeLimit?: string } } = {
  basePath: "/researchtool",
  serverExternalPackages: ["pdfkit"],
  serverActions: {
    bodySizeLimit: "10mb",
  },
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
