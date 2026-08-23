/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
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
