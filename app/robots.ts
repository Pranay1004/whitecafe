import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = 'https://whitecafe.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/menu', '/booking', '/login', '/guest'],
        disallow: ['/admin/', '/api/', '/confirmation'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
