import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Offline: navigations wait for the network instead of failing, and useOffline() drives the banner.
  experimental: { useOffline: true },
  // A stray C:\code\package-lock.json would otherwise be taken as the workspace root.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
