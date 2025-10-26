/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cdn.alquran.cloud', 'quran.com', 'api.alquran.cloud'],
  },
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
  },
};

module.exports = nextConfig;
