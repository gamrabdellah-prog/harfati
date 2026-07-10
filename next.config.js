/** @type {import('next').NextConfig} */
module.exports = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    unoptimized: true,
    domains: ['images.pexels.com', 'images.unsplash.com'],
  },
};
