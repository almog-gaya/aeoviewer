/** @type {import('next').NextConfig} */

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

const nextConfig = {
  /* config options here */
  output: 'export', // Required for static site generation
  images: {
    unoptimized: true, // Required for static export
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  experimental: {
    esmExternals: 'loose', // Handle ESM modules better
  },
  webpack: (config, { isServer }) => {
    // Handle Firebase functions and undici modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      // More aggressive exclusion of Firebase functions from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-functions': 'firebase-functions',
        'firebase-admin': 'firebase-admin',
        'undici': 'undici',
        'firebase/functions': 'firebase/functions',
      });

      // Add module resolution alias to prevent client-side imports
      config.resolve.alias = {
        ...config.resolve.alias,
        'firebase/functions': false,
      };
    }

    // Exclude problematic modules entirely
    config.module.rules.push({
      test: /node_modules\/undici/,
      use: 'ignore-loader'
    });

    // Configure module rules for better compatibility
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },
};

module.exports = nextConfig; 