// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
 // This is the block you need to add
 images: {
   remotePatterns: [
     {
       protocol: 'https',
       hostname: 'images.unsplash.com',
       port: '',
       pathname: '/**', // This allows any path on the hostname
     },
   ],
 },
};

export default nextConfig;
