/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: '427782383186-ucgo3fgiusdbt9glrkv9qr205jmko1j8.apps.googleusercontent.com',
  },
}

module.exports = nextConfig
