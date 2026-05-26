import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://oo0kccg00sgo80oo804og4gw.89.117.53.152.sslip.io"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
