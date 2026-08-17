import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
};

export default nextConfig;
