/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  images: {
    domains: [
      'images-na.ssl-images-amazon.com',
      'images.gr-assets.com',
    ]
  }
};

export default config;
