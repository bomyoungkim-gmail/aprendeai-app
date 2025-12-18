/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fix for canvas module (used by Konva and PDF.js)
    config.externals = config.externals || {};
    config.externals.canvas = 'canvas';
    
    // Canvas alias fix
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;
