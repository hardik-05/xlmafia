/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // POC: don't fail the Vercel build on lint; CI/local `npm run lint` still works.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // pdfjs-dist tries to require Node "canvas" on the server path; we only use it
    // client-side, so stub it out for the webpack build.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
