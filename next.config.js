import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
