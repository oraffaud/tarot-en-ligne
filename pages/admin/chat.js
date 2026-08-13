import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminChat() {
  const [session,setSession]=useState(null), [items,setItems]=useState([]), [active,setActive]=useState(null), [messages,setMessages]=useState([]), [body,setBody]=useState(''), [notice,setNotice]=useState('')
  const user=session?.user
  useEffect(()=>{ if(!supabase)return; supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return()=>data.subscription.unsubscribe() },[])
  useEffect(()=>{ if(!user)return; load() },[user?.id])
  async function load(){ const {data,error}=await supabase.from('conversations').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false}); if(error)setNotice(error.message); else setItems(data||[]) }
  async function open(c){ setActive(c); const {data,error}=await supabase.from('messages').select('*').eq('conversation_id',c.id).order('created_at',{ascending:true}); if(error)setNotice(error.message); else setMessages(data||[]) }
  async function send(e){ e.preventDefault(); const text=body.trim(); if(!text||!active)return; setBody(''); const {data,error}=await supabase.from('messages').insert({conversation_id:active.id,sender_id:user.id,body:text}).select().single(); if(error)setNotice(error.message); else setMessages(v=>[...v,data]) }
  if(!user)return <main style={page}><div style={card}><h1>Espace propriétaire</h1><p>Connectez-vous d’abord via la page du chat avec l’adresse e-mail du compte propriétaire.</p></div></main>
  return <main style={page}><div style={{...card,maxWidth:1100}}><h1>Conversations Premium</h1><p style={{opacity:.7}}>Cette page n’affiche que les conversations attribuées à votre compte propriétaire.</p><div style={{display:'grid',gridTemplateColumns:'minmax(220px,1fr) 2fr',gap:18}}><aside>{items.length===0?<p>Aucune conversation attribuée.</p>:items.map(c=><button key={c.id} onClick={()=>open(c)} style={{display:'block',width:'100%',padding:12,marginBottom:8,textAlign:'left',borderRadius:10,border:'1px solid rgba(255,255,255,.15)',background:'rgba(255,255,255,.06)',color:'#fff'}}>{c.subject||'Chat Premium'}<br/><small>{c.status}</small></button>)}</aside><section>{active?<><h2>{active.subject||'Chat Premium'}</h2><div style={thread}>{messages.map(m=><div key={m.id} style={{...bubble,marginLeft:m.sender_id===user.id?'auto':0}}>{m.body}</div>)}</div><form onSubmit={send} style={{display:'flex',gap:8}}><input value={body} onChange={e=>setBody(e.target.value)} maxLength={4000} style={{...input,margin:0,flex:1}}/><button style={button}>Envoyer</button></form></>:<p>Sélectionnez une conversation.</p>}</section></div>{notice&&<p>{notice}</p>}</div></main>
}
const page={minHeight:'100vh',padding:'40px 18px',background:'#171321',color:'#fff',fontFamily:'system-ui,sans-serif'}
const card={maxWidth:820,margin:'0 auto',padding:24,borderRadius:18,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.15)'}
const input={padding:'12px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,.25)',background:'rgba(0,0,0,.18)',color:'#fff'}
const button={padding:'12px 16px',border:0,borderRadius:10,fontWeight:700}
const thread={height:420,overflowY:'auto',padding:'12px 0',marginBottom:12,borderTop:'1px solid rgba(255,255,255,.12)',borderBottom:'1px solid rgba(255,255,255,.12)'}
const bubble={maxWidth:'78%',padding:'10px 12px',borderRadius:12,marginBottom:8,background:'rgba(255,255,255,.1)',whiteSpace:'pre-wrap'}
