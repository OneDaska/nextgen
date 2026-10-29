/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: '/', destination: '/nextgen.html', permanent: false }];
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
