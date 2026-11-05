import type { NextConfig } from "next";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

// Where the Express API runs. The browser never calls it directly: every request goes to
// /backend/* on this site and is proxied there, so the session cookie is first-party.
// (Cross-site cookies are blocked by Safari and often Chrome, which logged users straight out.)
const BACKEND_URL = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API ?? "http://localhost:3001").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve(__dir, ".."),
  },
  allowedDevOrigins: ['10.195.218.238'],
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};

export default nextConfig;
