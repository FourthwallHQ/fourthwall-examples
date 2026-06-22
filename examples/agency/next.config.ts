import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@fourthwall-examples/ui"],
  turbopack: { root },
};

export default nextConfig;
