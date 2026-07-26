/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mynameissanderdekker.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
}

export default nextConfig
