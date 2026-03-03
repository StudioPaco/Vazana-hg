/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Next.js 16 uses Turbopack by default; empty config to acknowledge it
  turbopack: {},
}

export default nextConfig
