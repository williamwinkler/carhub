import type { NextConfig } from "next";
import { validateWebEnv } from "./env";

const webEnv = validateWebEnv(process.env);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: webEnv.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
