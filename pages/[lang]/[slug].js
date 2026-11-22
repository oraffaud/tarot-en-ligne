import Head from 'next/head'
import Link from 'next/link'
import { ARCANA, INTENT_PAGES, SITE_URL, getSeoPage } from '../../lib/seoContent'

const CONTENT_UPDATED_AT = '2026-11-22'

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

function arcanaDetails(lang, slug){
  const index=ARCANA.findIndex(a=>(lang==='fr'?a[0]:a[1])===slug)
  if(index<0) return null
  const row=ARCANA[index]
  return {
    index,
    name:lang==='fr'?row[2]:row[3],
    image:`${SITE_URL}/cards/${index}.jpg`,
  }
}

export default function SeoLanding({lang,page}){
  const canonical=`${SITE_URL}/${lang}/${page.slug}`
  const altLang=lang==='fr'?'en':'fr'
  let altSlug=''
  if(page.type==='arcana'){
    const arc=ARCANA.find(a=>(lang==='fr'?a[0]:a[1])===page.slug)
    altSlug=altLang==='fr'?arc[0]:arc[1]
  } else {
    const idx=INTENT_PAGES[lang].findIndex(p=>p.slug===page.slug)
    altSlug=INTENT_PAGES[altLang][idx]?.slug || ''
  }
  const alternate=altSlug?`${SITE_URL}/${altLang}/${altSlug}`:SITE_URL
  const arcana=arcanaDetails(lang,page.slug)
  const image=arcana?.image || `${SITE_URL}/icon-512.png`
  const organizationId=`${SITE_URL}/#organization`
  const websiteId=`${SITE_URL}/#website`
  const breadcrumbId=`${canonical}#breadcrumb`
  const pageId=`${canonical}#webpage`
  const articleId=`${canonical}#article`

  const pageNode=page.type==='arcana' ? {
    '@type':'Article',
    '@id':articleId,
    headline:page.title,
    description:page.description,
    image,
    dateModified:CONTENT_UPDATED_AT,
    inLanguage:lang==='fr'?'fr-FR':'en-GB',
    mainEntityOfPage:{'@id':pageId},
    author:{'@id':organizationId},
    publisher:{'@id':organizationId},
  } : {
    '@type':'WebPage',
    '@id':pageId,
    url:canonical,
    name:page.title,
    description:page.description,
    image,
    dateModified:CONTENT_UPDATED_AT,
    inLanguage:lang==='fr'?'fr-FR':'en-GB',
    isPartOf:{'@id':websiteId},
    breadcrumb:{'@id':breadcrumbId},
  }

  const jsonLd={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'Organization',
        '@id':organizationId,
        name:'1001 Perspectives',
        url:SITE_URL,
        logo:{'@type':'ImageObject',url:`${SITE_URL}/icon-512.png`},
      },
      {
        '@type':'WebSite',
        '@id':websiteId,
        name:'1001 Perspectives',
        url:SITE_URL,
        publisher:{'@id':organizationId},
        inLanguage:['fr-FR','en-GB'],
      },
      {
        '@type':'WebPage',
        '@id':pageId,
        url:canonical,
        name:page.title,
        description:page.description,
        image,
        dateModified:CONTENT_UPDATED_AT,
        inLanguage:lang==='fr'?'fr-FR':'en-GB',
        isPartOf:{'@id':websiteId},
        breadcrumb:{'@id':breadcrumbId},
        ...(page.type==='arcana'?{mainEntity:{'@id':articleId}}:{}),
      },
      ...(page.type==='arcana'?[pageNode]:[]),
      {
        '@type':'BreadcrumbList',
        '@id':breadcrumbId,
        itemListElement:[
          {'@type':'ListItem',position:1,name:'1001 Perspectives',item:SITE_URL},
          {'@type':'ListItem',position:2,name:lang==='fr'?'Tarot de Marseille':'Marseille Tarot',item:`${SITE_URL}/${lang}/${INTENT_PAGES[lang][0].slug}`},
          {'@type':'ListItem',position:3,name:page.h1,item:canonical},
        ],
      },
    ],
  }

  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white">
    <Head>
      <title>{page.title} | 1001 Perspectives</title>
      <meta name="description" content={page.description}/>
      <meta name="robots" content="index, follow"/>
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
      <meta name="twitter:image" content={image}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
    </Head>
    <main className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm text-violet-300" aria-label={lang==='fr'?'Fil d’Ariane':'Breadcrumb'}>
        <Link href="/">1001 Perspectives</Link>
        <span className="mx-2">›</span>
        <Link href={`/${lang}/${INTENT_PAGES[lang][0].slug}`}>{lang==='fr'?'Tarot de Marseille':'Marseille Tarot'}</Link>
        <span className="mx-2">›</span>
        <span>{page.h1}</span>
      </nav>

      <header className={`mt-8 ${arcana?'grid gap-8 md:grid-cols-[220px_1fr] md:items-center':''}`}>
        {arcana && <img src={`/cards/${arcana.index}.jpg`} alt={`${arcana.name} — ${lang==='fr'?'Tarot de Marseille':'Marseille Tarot'}`} width="440" height="760" className="mx-auto w-[180px] rounded-2xl shadow-2xl md:w-[220px]"/>}
        <div>
          <div className="text-3xl">☾ ✦ ☽</div>
          <h1 className="mt-4 text-4xl md:text-5xl font-serif">{page.h1}</h1>
          <p className="mt-5 text-lg leading-8 text-violet-100">{page.intro}</p>
        </div>
      </header>

      <section className="mt-10 space-y-6">{page.sections.map(([h,p])=><article key={h} className="rounded-2xl border border-white/10 bg-white/[0.055] p-6"><h2 className="font-serif text-2xl text-amber-100">{h}</h2><p className="mt-3 leading-8 text-violet-100">{p}</p></article>)}</section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="font-serif text-2xl text-amber-100">{lang==='fr'?'Explorer les 22 arcanes majeurs':'Explore the 22 Major Arcana'}</h2>
        <p className="mt-3 leading-7 text-violet-200">{lang==='fr'?'Parcourez les cartes du Tarot de Marseille pour comparer leurs symboles et approfondir votre lecture.':'Browse the Marseille Tarot cards to compare their symbols and continue your reading.'}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {ARCANA.map((item,index)=>{
            const slug=lang==='fr'?item[0]:item[1]
            const name=lang==='fr'?item[2]:item[3]
            const current=slug===page.slug
            return <Link key={slug} href={`/${lang}/${slug}`} aria-current={current?'page':undefined} className={`rounded-xl border px-4 py-3 text-sm transition ${current?'border-amber-200 bg-amber-100/15 text-amber-100':'border-white/10 text-violet-100 hover:border-amber-100/40 hover:bg-white/[0.06]'}`}><span className="mr-2 text-violet-400">{String(index).padStart(2,'0')}</span>{name}</Link>
          })}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-amber-100/20 bg-amber-100/[0.06] p-6 text-center"><h2 className="font-serif text-2xl">{lang==='fr'?'Faire un tirage maintenant':'Start a Tarot reading'}</h2><p className="mt-2 text-violet-200">{lang==='fr'?'Formulez votre question et choisissez votre tirage de Tarot de Marseille.':'Write your question and choose a Marseille Tarot spread.'}</p><Link href={`/?lang=${lang}`} className="inline-block mt-5 rounded-full bg-amber-200 text-violet-950 px-7 py-3 font-semibold">{lang==='fr'?'Commencer le tirage':'Start the reading'}</Link></section>

      <footer className="mt-10 flex flex-wrap gap-4 text-sm text-violet-300"><Link href={`/${lang}/${INTENT_PAGES[lang][0].slug}`}>{lang==='fr'?'Tarot de Marseille':'Marseille Tarot'}</Link><Link href={`/${lang}/${INTENT_PAGES[lang][1].slug}`}>{lang==='fr'?'Tirage en ligne':'Online reading'}</Link><Link href={`/${lang}/${INTENT_PAGES[lang][2].slug}`}>{lang==='fr'?'Tarot amour':'Love Tarot'}</Link><Link href={`/${lang}/${INTENT_PAGES[lang][3].slug}`}>{lang==='fr'?'Tarot travail':'Career Tarot'}</Link><Link href={`/${lang}/${INTENT_PAGES[lang][4].slug}`}>{lang==='fr'?'Consultation':'Tarot reader'}</Link></footer>
    </main>
  </div>
}
