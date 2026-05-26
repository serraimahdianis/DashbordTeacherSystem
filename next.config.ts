import type { NextConfig } from "next";

// The backend URL used by the server-side rewrite proxy.
// Set API_URL or NEXT_PUBLIC_API_URL in Vercel Environment Variables.
// Fallback is the production backend.
const BACKEND_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://oo0kccg00sgo80oo804og4gw.89.117.53.152.sslip.io";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
