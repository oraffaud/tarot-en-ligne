import '../styles/globals.css'
import Head from 'next/head'
import { useRouter } from 'next/router'

const SITE_URL = 'https://www.1001perspectives.com'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isHome = router.pathname === '/'
  const homeSchema = {
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'Organization',
        '@id':`${SITE_URL}/#organization`,
        name:'1001 Perspectives',
        url:SITE_URL,
        logo:{'@type':'ImageObject',url:`${SITE_URL}/icon-512.png`}
      },
      {
        '@type':'WebSite',
        '@id':`${SITE_URL}/#website`,
        name:'1001 Perspectives',
        url:SITE_URL,
        inLanguage:['fr','en'],
        publisher:{'@id':`${SITE_URL}/#organization`}
      }
    ]
  }
  return <>
    {isHome && <Head>
      <link rel="canonical" href={`${SITE_URL}/`}/>
      <meta name="robots" content="index,follow"/>
      <meta property="og:url" content={`${SITE_URL}/`}/>
      <meta property="og:site_name" content="1001 Perspectives"/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(homeSchema)}}/>
    </Head>}
    <Component {...pageProps} />
  </>
}
