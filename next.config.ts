import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // A stray C:\code\package-lock.json would otherwise be taken as the workspace root.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
