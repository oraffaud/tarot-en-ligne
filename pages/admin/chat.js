import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminChat() {
  const [session,setSession]=useState(null)
  const [email,setEmail]=useState('')
  const [role,setRole]=useState(null)
  const [items,setItems]=useState([])
  const [active,setActive]=useState(null)
  const [messages,setMessages]=useState([])
  const [body,setBody]=useState('')
  const [notice,setNotice]=useState('')
  const [loading,setLoading]=useState(true)
  const user=session?.user

  useEffect(()=>{
    if(!supabase){ setNotice('Configuration Supabase absente.'); setLoading(false); return }
    supabase.auth.getSession().then(({data})=>{ setSession(data.session); setLoading(false) })
    const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s))
    return()=>data.subscription.unsubscribe()
  },[])

  useEffect(()=>{
    if(!user){ setRole(null); return }
    verifyOwner()
  },[user?.id])

  async function verifyOwner(){
    setNotice('')
    const {data,error}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
    if(error){ setNotice(error.message); return }
    setRole(data?.role||'client')
    if(data?.role==='owner') load()
  }

  async function login(e){
    e.preventDefault()
    setNotice('')
    const redirectTo=`${window.location.origin}/admin/chat`
    const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}})
    setNotice(error ? error.message : 'Un lien de connexion propriétaire vient de vous être envoyé par e-mail.')
  }

  async function logout(){
    await supabase.auth.signOut()
    setRole(null); setItems([]); setActive(null); setMessages([])
  }

  async function load(){
    const {data,error}=await supabase.from('conversations').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false})
    if(error)setNotice(error.message); else setItems(data||[])
  }

  async function open(c){
    setActive(c)
    const {data,error}=await supabase.from('messages').select('*').eq('conversation_id',c.id).order('created_at',{ascending:true})
    if(error)setNotice(error.message); else setMessages(data||[])
  }

  async function send(e){
    e.preventDefault()
    const text=body.trim(); if(!text||!active)return
    setBody('')
    const {data,error}=await supabase.from('messages').insert({conversation_id:active.id,sender_id:user.id,body:text}).select().single()
    if(error)setNotice(error.message); else setMessages(v=>[...v,data])
  }

  if(loading)return <main style={page}><div style={card}><p>Chargement…</p></div></main>

  if(!user)return <main style={page}><div style={card}><h1>Espace propriétaire</h1><p>Connexion réservée à Nanou.</p><form onSubmit={login}><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="adresse e-mail propriétaire" style={{...input,width:'100%',boxSizing:'border-box',margin:'12px 0'}}/><button style={button}>Recevoir mon lien sécurisé</button></form>{notice&&<p style={{marginTop:16}}>{notice}</p>}</div></main>

  if(role && role!=='owner')return <main style={page}><div style={card}><h1>Accès refusé</h1><p>Ce compte n’est pas autorisé à accéder à l’espace propriétaire.</p><button onClick={logout} style={button}>Se déconnecter</button>{notice&&<p>{notice}</p>}</div></main>

  return <main style={page}><div style={{...card,maxWidth:1100}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><h1 style={{marginBottom:6}}>Conversations Premium</h1><p style={{opacity:.7,marginTop:0}}>Espace propriétaire sécurisé.</p></div><button onClick={logout} style={{...button,background:'rgba(255,255,255,.12)',color:'#fff'}}>Se déconnecter</button></div><div style={{display:'grid',gridTemplateColumns:'minmax(220px,1fr) 2fr',gap:18}}><aside>{items.length===0?<p>Aucune conversation attribuée.</p>:items.map(c=><button key={c.id} onClick={()=>open(c)} style={{display:'block',width:'100%',padding:12,marginBottom:8,textAlign:'left',borderRadius:10,border:'1px solid rgba(255,255,255,.15)',background:'rgba(255,255,255,.06)',color:'#fff'}}>{c.subject||'Chat Premium'}<br/><small>{c.status}</small></button>)}</aside><section>{active?<><h2>{active.subject||'Chat Premium'}</h2><div style={thread}>{messages.map(m=><div key={m.id} style={{...bubble,marginLeft:m.sender_id===user.id?'auto':0}}>{m.body}</div>)}</div><form onSubmit={send} style={{display:'flex',gap:8}}><input value={body} onChange={e=>setBody(e.target.value)} maxLength={4000} style={{...input,margin:0,flex:1}}/><button style={button}>Envoyer</button></form></>:<p>Sélectionnez une conversation.</p>}</section></div>{notice&&<p>{notice}</p>}</div></main>
}

const page={minHeight:'100vh',padding:'40px 18px',background:'#171321',color:'#fff',fontFamily:'system-ui,sans-serif'}
const card={maxWidth:820,margin:'0 auto',padding:24,borderRadius:18,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.15)'}
const input={padding:'12px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,.25)',background:'rgba(0,0,0,.18)',color:'#fff'}
const button={padding:'12px 16px',border:0,borderRadius:10,fontWeight:700,cursor:'pointer'}
const thread={height:420,overflowY:'auto',padding:'12px 0',marginBottom:12,borderTop:'1px solid rgba(255,255,255,.12)',borderBottom:'1px solid rgba(255,255,255,.12)'}
const bubble={maxWidth:'78%',padding:'10px 12px',borderRadius:12,marginBottom:8,background:'rgba(255,255,255,.1)',whiteSpace:'pre-wrap'}
