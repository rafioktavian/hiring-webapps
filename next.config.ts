import type {NextConfig} from 'next';

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  {
    protocol: 'https',
    hostname: 'placehold.co',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'picsum.photos',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'illustrations.popsy.co',
    port: '',
    pathname: '/**',
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl);
    remotePatterns.push({
      protocol: 'https',
      hostname,
      port: '',
      pathname: '/storage/v1/object/public/**',
    });
  } catch (error) {
    console.warn('Failed to parse NEXT_PUBLIC_SUPABASE_URL for Next.js image configuration.', error);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
