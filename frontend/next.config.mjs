/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow both localhost and 127.0.0.1 to access static assets
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000"],
  webpack: (config) => {
    // Configuration for @react-pdf-viewer
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Fix for canvas module (used by Konva and PDF.js)
    config.externals = [...(config.externals || []), { canvas: "canvas" }];

    // Fix for pdfjs-dist worker
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },
  // Ensure static files are served correctly
  async headers() {
    return [
      {
        source: "/pdf-worker/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Allow CORS for PDF loading
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
