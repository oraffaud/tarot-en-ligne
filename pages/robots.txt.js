import { SITE_URL } from '../lib/seoContent'
export async function getServerSideProps({res}){
  const body=`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /chat/\nDisallow: /chat-preview\nDisallow: /consultante/\nDisallow: /premium/result\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  res.setHeader('Content-Type','text/plain; charset=utf-8'); res.write(body); res.end(); return {props:{}}
}
export default function Robots(){return null}
