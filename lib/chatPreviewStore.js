import crypto from 'crypto'
import { getPaymentStore } from './stripeServer'

export function newToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex')
}

export function publicOrigin(req) {
  return req.headers.origin || `https://${req.headers.host}`
}

export async function getChatSessionByCheckout(checkoutSessionId) {
  const db = getPaymentStore()
  const { data, error } = await db
    .from('chat_sessions_preview')
    .select('*')
    .eq('checkout_session_id', checkoutSessionId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getChatSessionById(id) {
  const db = getPaymentStore()
  const { data, error } = await db
    .from('chat_sessions_preview')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createChatSession({ checkout, accelerated = false }) {
  const existing = await getChatSessionByCheckout(checkout.id)
  if (existing) return existing

  const db = getPaymentStore()
  const row = {
    checkout_session_id: checkout.id,
    stripe_customer_id: typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id || null,
    customer_email: checkout.customer_details?.email || checkout.customer_email || null,
    customer_token: newToken(),
    owner_token: newToken(),
    accelerated,
    status: 'active',
    billing_block: 1,
    amount_paid: 3990,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  const { data, error } = await db.from('chat_sessions_preview').insert(row).select('*').single()
  if (error) throw error
  return data
}

export function authorizeSession(session, token, role) {
  if (!session || !token) return false
  if (role === 'owner') return token === session.owner_token
  return token === session.customer_token
}

export async function listMessages(sessionId) {
  const db = getPaymentStore()
  const { data, error } = await db
    .from('chat_messages_preview')
    .select('id, role, body, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addMessage(sessionId, role, body) {
  const db = getPaymentStore()
  const { data, error } = await db
    .from('chat_messages_preview')
    .insert({ session_id: sessionId, role, body: String(body || '').trim().slice(0, 4000) })
    .select('id, role, body, created_at')
    .single()
  if (error) throw error
  return data
}
