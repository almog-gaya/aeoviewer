/** @type {import('next').NextConfig} */

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
const nextConfig = {
    images: {
        unoptimized: true, // Keep if needed for your hosting; optional for serverless
    },
    eslint: {
        ignoreDuringBuilds: true, // Ignore ESLint errors during build
    },
    experimental: {
        esmExternals: 'loose', // Handle ESM modules better
    },
    webpack: (config, { isServer }) => {
        // Handle server-side modules for client-side builds
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
        }

        // Configure module rules for compatibility
        config.module.rules.push({
            test: /\.m?js$/,
            type: "javascript/auto",
            resolve: {
                fullySpecified: false,
            },
        });

        return config;
    },
};

module.exports = nextConfig;