import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/researchtool",
  serverExternalPackages: ["pdfkit"],
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: "50mb",
    },
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
