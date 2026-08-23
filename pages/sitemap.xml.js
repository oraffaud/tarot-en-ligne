import { SITE_URL, allSeoUrls } from '../lib/seoContent'

function xmlEscape(s=''){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}

export async function getServerSideProps({res}){
  const now=new Date().toISOString()
  const urls=['/',...allSeoUrls()].map(path=>`${SITE_URL}${path}`)
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${xmlEscape(url)}</loc><lastmod>${now}</lastmod><changefreq>${url===SITE_URL+'/'?'daily':'weekly'}</changefreq><priority>${url===SITE_URL+'/'?'1.0':'0.8'}</priority></url>`).join('\n')}\n</urlset>`
  res.setHeader('Content-Type','application/xml; charset=utf-8')
  res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400')
  res.write(xml); res.end()
  return {props:{}}
}
export default function Sitemap(){return null}
