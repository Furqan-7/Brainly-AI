import type { NextConfig } from "next";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve(__dir, ".."),
  },
  allowedDevOrigins: ['10.195.218.238'],
};

export default nextConfig;
