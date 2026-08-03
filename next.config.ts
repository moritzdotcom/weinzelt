import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
};

export default nextConfig;
