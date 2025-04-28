/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config:any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'maplibre-gl'
    };
    return config;
  },
  transpilePackages: ['mapbox-gl'],
};

module.exports = nextConfig;