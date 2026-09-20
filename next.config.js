/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
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
    // Compatible first layer: does not block payment scripts, connections or
    // embedded frames. A strict script CSP needs separate nonce/rendering work.
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), usb=()' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests" }
    ]
    return [
      { source: '/:path*', headers: security },
      { source: '/api/:path*', headers: noindex },
      { source: '/chat/:path*', headers: noindex },
      { source: '/chat-preview', headers: noindex },
      { source: '/consultante/:path*', headers: noindex },
      { source: '/premium/result', headers: noindex },
      { source: '/conditions', headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }] }
    ]
  }
}
