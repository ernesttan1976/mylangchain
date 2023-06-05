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
    MILVUS_URL: process.env.MILVUS_URL,
    MILVUS_USERNAME: process.env.MILVUS_USERNAME,
    MILVUS_PASSWORD: process.env.MILVUS_PASSWORD,
    PINECONE_KEY: process.env.PINECONE_KEY,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client sides
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MYSCALE_HOST: process.env.MYSCALE_HOST,
    MYSCALE_PORT: process.env.MYSCALE_PORT,
    MYSCALE_USER_NAME: process.env.MYSCALE_USER_NAME,
    MYSCALE_PASSWORD: process.env.MYSCALE_PASSWORD,
    MILVUS_URL: process.env.MILVUS_URL,
    MILVUS_USERNAME: process.env.MILVUS_USERNAME,
    MILVUS_PASSWORD: process.env.MILVUS_PASSWORD,
    PINECONE_KEY: process.env.PINECONE_KEY,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
  },
}

module.exports = nextConfig;
