/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/tarot-en-ligne', destination: '/fr/tirage-tarot-en-ligne', permanent: true },
      { source: '/tirage-tarot-amour', destination: '/fr/tirage-amour', permanent: true },
      { source: '/tarot-de-marseille-en-ligne', destination: '/fr/tarot-de-marseille', permanent: true },
      { source: '/voyance-amour', destination: '/fr/tirage-amour', permanent: true },
      { source: '/tarot-travail', destination: '/fr/tirage-travail', permanent: true },
      { source: '/voyance-en-ligne', destination: '/fr/consultation-tarologue', permanent: true },
      { source: '/consultation-voyance-privee', destination: '/fr/consultation-tarologue', permanent: true },
      { source: '/cartomancie-en-ligne', destination: '/fr/tarot-de-marseille', permanent: true },
      { source: '/tarot-oui-non', destination: '/fr/tirage-tarot-en-ligne', permanent: true }
    ]
  },
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]
    return [
      { source: '/api/:path*', headers: noindex },
      { source: '/chat/:path*', headers: noindex },
      { source: '/chat-preview', headers: noindex },
      { source: '/consultante/:path*', headers: noindex },
      { source: '/premium/result', headers: noindex },
      { source: '/conditions', headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }] }
    ]
  }
}
