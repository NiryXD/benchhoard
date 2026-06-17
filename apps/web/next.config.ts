import type { NextConfig } from "next";

// Static export only — Cloudflare Pages free tier, no server runtime.
// Build output lands in apps/web/out.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@benchhoard/shared"],
};

export default nextConfig;
