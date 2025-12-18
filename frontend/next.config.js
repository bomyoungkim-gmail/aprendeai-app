/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fix for canvas module (used by Konva)
    config.externals = config.externals || {};
    config.externals.canvas = 'canvas';
    
    return config;
  },
};

module.exports = nextConfig;
