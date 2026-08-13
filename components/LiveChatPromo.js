import Link from 'next/link'

export default function LiveChatPromo() {
  return (
    <section style={{maxWidth:900,margin:'32px auto',padding:'24px',border:'1px solid rgba(255,255,255,.22)',borderRadius:18,background:'rgba(255,255,255,.07)',textAlign:'center'}}>
      <div style={{fontSize:13,letterSpacing:1.2,textTransform:'uppercase',opacity:.75}}>Premium</div>
      <h2 style={{margin:'8px 0 10px'}}>Chat en direct avec Nanou</h2>
      <p style={{margin:'0 auto 18px',maxWidth:650,lineHeight:1.6}}>Après votre tirage Premium, approfondissez son interprétation dans une conversation privée avec Nanou.</p>
      <Link href="/premium/chat" style={{display:'inline-block',padding:'12px 18px',borderRadius:12,background:'#fff',color:'#111',fontWeight:700,textDecoration:'none'}}>Accéder au chat Premium</Link>
    </section>
  )
}
