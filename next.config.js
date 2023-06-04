/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    // Will only be available on the server side
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MYSCALE_HOST: process.env.MYSCALE_HOST,
    MYSCALE_PORT: process.env.MYSCALE_PORT,
    MYSCALE_USER_NAME: process.env.MYSCALE_USER_NAME,
    MYSCALE_PASSWORD: process.env.MYSCALE_PASSWORD,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client sides
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

module.exports = nextConfig;
