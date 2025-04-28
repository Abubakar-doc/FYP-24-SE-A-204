/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config:any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'maplibre-gl'
    };
    return config;
  },
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
};

module.exports = nextConfig;