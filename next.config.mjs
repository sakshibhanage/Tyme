/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  async redirects() {
    return [
      // Legacy / mistaken URL — app has no server-side vault; sealing happens at /seal
      { source: '/vault', destination: '/seal', permanent: false },
    ]
  },
}

export default nextConfig
