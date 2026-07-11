import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'jayjejqjswxtksvwoqxp.supabase.co',
      },
    ],
  },
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {
      root: process.cwd(),
      rules: {
        "**/*.{tsx,jsx}": {
          loaders: [
            {
              loader: require.resolve("@locator/webpack-loader"),
              options: { env: "development" },
            },
          ],
        },
      },
    },
  }),
};

export default nextConfig;
