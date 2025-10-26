/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'cdn.islamic.network',
      'verses.quran.com',
      'api.alquran.cloud'
    ],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
  },
}

module.exports = nextConfig