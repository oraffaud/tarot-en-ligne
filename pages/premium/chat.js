import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

const DISCLAIMER_VERSION = '2026-08-13-v1'
const DISCLAIMER = "Le chat des Tarots de Nanou est un service d’accompagnement et d’interprétation symbolique. Les échanges ne constituent pas un avis médical, psychologique, juridique, financier ou professionnel. Les décisions prises à la suite d’une consultation restent sous la responsabilité de l’utilisateur. Les messages nécessaires au fonctionnement du service sont traités conformément à la politique de confidentialité."

export default function PremiumChat() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const user = session?.user

  useEffect(() => {
    if (!supabase) { setNotice('Configuration Supabase absente.'); setLoading(false); return }
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || !supabase) return
    let channel
    async function load() {
      const { data: conv } = await supabase.from('conversations').select('*').eq('client_id', user.id).eq('status','open').order('created_at',{ascending:false}).limit(1).maybeSingle()
      if (!conv) return
      setConversation(conv)
      const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id',conv.id).order('created_at',{ascending:true})
      setMessages(msgs || [])
      channel = supabase.channel(`chat-${conv.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conv.id}`}, payload => setMessages(current => current.some(m=>m.id===payload.new.id) ? current : [...current,payload.new])).subscribe()
    }
    load()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id])

  async function login(e) {
    e.preventDefault(); setNotice('')
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: window.location.href } })
    setNotice(error ? error.message : 'Un lien de connexion sécurisé vient de vous être envoyé par e-mail.')
  }

  async function startChat() {
    if (!accepted || !user) return
    const { data, error } = await supabase.from('conversations').insert({client_id:user.id,premium_verified:true,disclaimer_accepted:true,disclaimer_version:DISCLAIMER_VERSION,disclaimer_accepted_at:new Date().toISOString(),subject:'Chat Premium'}).select().single()
    if (error) return setNotice(error.message)
    setConversation(data); setMessages([])
  }

  async function send(e) {
    e.preventDefault()
    const text = body.trim(); if (!text || !conversation || !user) return
    setBody('')
    const { error } = await supabase.from('messages').insert({conversation_id:conversation.id,sender_id:user.id,body:text})
    if (error) setNotice(error.message)
  }

  const content = useMemo(() => {
    if (loading) return <p>Chargement…</p>
    if (!user) return <form onSubmit={login}><h2>Connexion sécurisée</h2><p>Entrez votre e-mail. Un lien de connexion à usage unique vous sera envoyé.</p><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" style={input}/><button style={button}>Recevoir mon lien sécurisé</button></form>
    if (!conversation) return <div><h2>Avant d’ouvrir le chat</h2><div style={disclaimer}>{DISCLAIMER}</div><label style={{display:'flex',gap:10,alignItems:'flex-start',margin:'18px 0'}}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>J’ai lu et j’accepte ces conditions d’utilisation du chat en direct.</span></label><button disabled={!accepted} onClick={startChat} style={{...button,opacity:accepted?1:.45}}>Entrer dans le chat</button></div>
    return <div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2>Chat en direct avec Nanou</h2><span style={{fontSize:13,opacity:.7}}>Conversation privée</span></div><div style={thread}>{messages.length===0?<p style={{opacity:.7}}>Votre conversation est ouverte. Envoyez votre premier message.</p>:messages.map(m=><div key={m.id} style={{...bubble,marginLeft:m.sender_id===user.id?'auto':0,background:m.sender_id===user.id?'rgba(255,255,255,.16)':'rgba(255,255,255,.08)'}}>{m.body}</div>)}</div><form onSubmit={send} style={{display:'flex',gap:8}}><input maxLength={4000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Votre message…" style={{...input,margin:0,flex:1}}/><button style={{...button,width:'auto',margin:0}}>Envoyer</button></form></div>
  }, [loading,user,email,accepted,conversation,messages,body])

  return <main style={page}><div style={card}><Link href="/" style={{color:'inherit'}}>← Les Tarots de Nanou</Link><h1 style={{marginBottom:8}}>Chat Premium sécurisé</h1><p style={{opacity:.75,marginTop:0}}>Échange privé entre le client Premium et Nanou.</p>{content}{notice&&<p style={{marginTop:16}}>{notice}</p>}</div></main>
}

const page={minHeight:'100vh',padding:'40px 18px',background:'#171321',color:'#fff',fontFamily:'system-ui,sans-serif'}
const card={maxWidth:820,margin:'0 auto',padding:24,borderRadius:18,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.15)'}
const input={width:'100%',boxSizing:'border-box',padding:'12px 14px',margin:'12px 0',borderRadius:10,border:'1px solid rgba(255,255,255,.25)',background:'rgba(0,0,0,.18)',color:'#fff'}
const button={padding:'12px 16px',border:0,borderRadius:10,fontWeight:700,cursor:'pointer'}
const disclaimer={padding:16,borderRadius:12,background:'rgba(255,255,255,.07)',lineHeight:1.6,fontSize:14}
const thread={height:380,overflowY:'auto',padding:'14px 0',margin:'12px 0',borderTop:'1px solid rgba(255,255,255,.12)',borderBottom:'1px solid rgba(255,255,255,.12)'}
const bubble={maxWidth:'78%',padding:'10px 12px',borderRadius:12,marginBottom:8,lineHeight:1.45,whiteSpace:'pre-wrap'}
