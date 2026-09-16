import Head from 'next/head'
import Link from 'next/link'
import { ARCANA, INTENT_PAGES, SITE_URL, getSeoPage } from '../../lib/seoContent'

export async function getStaticPaths(){
  const paths=[]
  for(const lang of ['fr','en']){
    for(const p of INTENT_PAGES[lang]) paths.push({params:{lang,slug:p.slug}})
    for(const a of ARCANA) paths.push({params:{lang,slug:lang==='fr'?a[0]:a[1]}})
  }
  return {paths,fallback:false}
}

export async function getStaticProps({params}){
  const page=getSeoPage(params.lang,params.slug)
  return {props:{lang:params.lang,page}}
}

export default function SeoLanding({lang,page}){
  const canonical=`${SITE_URL}/${lang}/${page.slug}`
  const altLang=lang==='fr'?'en':'fr'
  let altSlug=''
  let arcIndex=-1
  if(page.type==='arcana'){
    arcIndex=ARCANA.findIndex(a=>(lang==='fr'?a[0]:a[1])===page.slug)
    const arc=ARCANA[arcIndex]
    altSlug=altLang==='fr'?arc[0]:arc[1]
  } else {
    const idx=INTENT_PAGES[lang].findIndex(p=>p.slug===page.slug)
    altSlug=INTENT_PAGES[altLang][idx]?.slug || ''
  }
  const alternate=altSlug?`${SITE_URL}/${altLang}/${altSlug}`:SITE_URL
  const image=page.image || (arcIndex>=0?`${SITE_URL}/cards-marseille/${arcIndex}.jpg`:`${SITE_URL}/icon-512.png`)
  const organization={
    '@type':'Organization',
    '@id':`${SITE_URL}/#organization`,
    name:'1001 Perspectives',
    url:SITE_URL,
    logo:{'@type':'ImageObject',url:`${SITE_URL}/icon-512.png`}
  }
  const website={
    '@type':'WebSite',
    '@id':`${SITE_URL}/#website`,
    name:'1001 Perspectives',
    url:SITE_URL,
    publisher:{'@id':`${SITE_URL}/#organization`}
  }
  const mainEntity={
    '@type':page.type==='arcana'?'Article':'WebPage',
    '@id':`${canonical}#page`,
    headline:page.title,
    name:page.title,
    description:page.description,
    inLanguage:lang,
    url:canonical,
    image,
    isPartOf:{'@id':`${SITE_URL}/#website`},
    publisher:{'@id':`${SITE_URL}/#organization`}
  }
  if(page.type==='arcana'){
    mainEntity.datePublished='2026-08-24'
    mainEntity.dateModified='2026-09-16'
    mainEntity.author={'@id':`${SITE_URL}/#organization`}
  }
  const breadcrumb={
    '@type':'BreadcrumbList',
    '@id':`${canonical}#breadcrumb`,
    itemListElement:[
      {'@type':'ListItem',position:1,name:'1001 Perspectives',item:SITE_URL},
      {'@type':'ListItem',position:2,name:lang.toUpperCase(),item:`${SITE_URL}/${lang}`},
      {'@type':'ListItem',position:3,name:page.h1,item:canonical}
    ]
  }
  const faqEntity=page.faqs?.length?{
    '@type':'FAQPage',
    '@id':`${canonical}#faq`,
    mainEntity:page.faqs.map(([q,a])=>({
      '@type':'Question',
      name:q,
      acceptedAnswer:{'@type':'Answer',text:a}
    }))
  }:null
  const jsonLd={'@context':'https://schema.org','@graph':[organization,website,mainEntity,breadcrumb,...(faqEntity?[faqEntity]:[])]}
  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white">
    <Head>
      <title>{page.title}</title>
      <meta name="description" content={page.description}/>
      <meta name="robots" content="index,follow"/>
      <link rel="canonical" href={canonical}/>
      <link rel="alternate" hrefLang={lang} href={canonical}/>
      <link rel="alternate" hrefLang={altLang} href={alternate}/>
      <link rel="alternate" hrefLang="x-default" href={SITE_URL}/>
      <meta property="og:title" content={page.title}/>
      <meta property="og:description" content={page.description}/>
      <meta property="og:type" content={page.type==='arcana'?'article':'website'}/>
      <meta property="og:url" content={canonical}/>
      <meta property="og:image" content={image}/>
      <meta name="twitter:card" content="summary_large_image"/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
    </Head>
    <main className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm text-violet-300"><Link href="/">1001 Perspectives</Link> <span className="mx-2">›</span> {lang.toUpperCase()}</nav>
      <header className="mt-8"><div className="text-3xl">☾ ✦ ☽</div><h1 className="mt-4 text-4xl md:text-5xl font-serif">{page.h1}</h1><p className="mt-5 text-lg leading-8 text-violet-100">{page.intro}</p></header>
      <section className="mt-10 space-y-6">{page.sections.map(([h,p])=><article key={h} className="rounded-2xl border border-white/10 bg-white/[0.055] p-6"><h2 className="font-serif text-2xl text-amber-100">{h}</h2><p className="mt-3 leading-8 text-violet-100">{p}</p></article>)}</section>
      {page.related?.length>0&&<section className="mt-10"><h2 className="font-serif text-2xl text-amber-100">{lang==='fr'?'À explorer aussi':'Explore next'}</h2><div className="mt-4 flex flex-wrap gap-3">{page.related.map(([slug,label])=><Link key={slug} href={`/${lang}/${slug}`} className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-violet-100 hover:bg-white/[0.08]">{label}</Link>)}</div></section>}
      {page.faqs?.length>0&&<section className="mt-10"><h2 className="font-serif text-3xl">{lang==='fr'?'Questions fréquentes':'Frequently asked questions'}</h2><div className="mt-5 space-y-4">{page.faqs.map(([q,a])=><article key={q} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><h3 className="font-semibold text-amber-100">{q}</h3><p className="mt-3 leading-7 text-violet-100">{a}</p></article>)}</div></section>}
      <section className="mt-10 rounded-2xl border border-amber-100/20 bg-amber-100/[0.06] p-6 text-center"><h2 className="font-serif text-2xl">{lang==='fr'?'Faire un tirage maintenant':'Start a Tarot reading'}</h2><p className="mt-2 text-violet-200">{lang==='fr'?'Formulez votre question et choisissez votre tirage de Tarot de Marseille.':'Write your question and choose a Marseille Tarot spread.'}</p><Link href={`/?lang=${lang}`} className="inline-block mt-5 rounded-full bg-amber-200 text-violet-950 px-7 py-3 font-semibold">{lang==='fr'?'Commencer le tirage':'Start the reading'}</Link></section>
      <footer className="mt-10 flex flex-wrap gap-4 text-sm text-violet-300"><Link href={`/${lang}/${INTENT_PAGES[lang][0].slug}`}>{lang==='fr'?'Tarot de Marseille':'Marseille Tarot'}</Link><Link href={`/${lang}/${INTENT_PAGES[lang][1].slug}`}>{lang==='fr'?'Tirage en ligne':'Online reading'}</Link><Link href={`/${lang}/${INTENT_PAGES[lang][2].slug}`}>{lang==='fr'?'Tarot amour':'Love Tarot'}</Link><Link href={`/${lang}/${INTENT_PAGES[lang][3].slug}`}>{lang==='fr'?'Tarot travail':'Career Tarot'}</Link></footer>
    </main>
  </div>
}
