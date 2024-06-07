/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY, 
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
