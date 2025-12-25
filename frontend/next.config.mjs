/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Configuration for @react-pdf-viewer
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Fix for pdfjs-dist worker
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    
    return config;
  },
  // Ensure static files are served correctly
  async headers() {
    return [
      {
        source: '/pdf-worker/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
