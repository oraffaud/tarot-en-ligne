import Stripe from 'stripe'
import { authorizeSession, getChatSessionById } from '../../../lib/chatPreviewStore'
import { getPaymentStore } from '../../../lib/stripeServer'

function getTestStripe() {
  if (process.env.VERCEL_ENV === 'production') throw new Error('Chat preview billing is disabled in production')
  const key = process.env.STRIPE_SECRET_KEY || ''
  if (!key.startsWith('sk_test_')) throw new Error('STRIPE_SECRET_KEY must be a Stripe test secret key in Preview')
  return new Stripe(key)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { id = '', token = '', block = 2 } = req.body || {}
    const room = await getChatSessionById(String(id))
    if (!authorizeSession(room, String(token), 'customer')) return res.status(403).json({ error: 'Forbidden' })
    if (room.status !== 'active') return res.status(409).json({ error: 'Session is not active' })

    const n = Math.max(2, Number.parseInt(block, 10) || 2)
    if (n <= room.billing_block) return res.status(200).json({ paid: true, status: 'already_paid', block: room.billing_block })

    const blockSeconds = room.accelerated ? 60 : 600
    const elapsedSeconds = Math.floor((Date.now() - new Date(room.started_at).getTime()) / 1000)
    const minimumElapsed = (n - 1) * blockSeconds
    if (elapsedSeconds < minimumElapsed) return res.status(409).json({ error: 'Renewal requested before billing boundary' })

    const stripe = getTestStripe()
    const checkout = await stripe.checkout.sessions.retrieve(room.checkout_session_id, { expand: ['payment_intent.payment_method'] })
    if (checkout.payment_status !== 'paid') return res.status(402).json({ error: 'Initial chat payment is not paid' })

    const customer = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id
    const paymentIntent = checkout.payment_intent
    const paymentMethod = typeof paymentIntent?.payment_method === 'string' ? paymentIntent.payment_method : paymentIntent?.payment_method?.id
    if (!customer || !paymentMethod) throw new Error('Saved customer/payment method not available')

    const intent = await stripe.paymentIntents.create({
      amount: 3990,
      currency: 'eur',
      customer,
      payment_method: paymentMethod,
      off_session: true,
      confirm: true,
      description: `Consultation privée avec Nanou — tranche ${n} de 10 minutes`,
      metadata: { service: 'nanou_chat', room_id: room.id, billing_block: String(n), billing_mode: 'auto_10min' }
    }, { idempotencyKey: `nanou-chat-${room.id}-block-${n}` })

    if (intent.status !== 'succeeded') throw new Error(`Payment status: ${intent.status}`)

    const db = getPaymentStore()
    const { error } = await db.from('chat_sessions_preview').update({
      billing_block: n,
      amount_paid: n * 3990,
      updated_at: new Date().toISOString()
    }).eq('id', room.id)
    if (error) throw error

    return res.status(200).json({ paid: true, status: intent.status, payment_intent_id: intent.id, block: n })
  } catch (e) {
    console.error('chat automatic renewal', e)
    try {
      const id = String(req.body?.id || '')
      if (id) {
        const db = getPaymentStore()
        await db.from('chat_sessions_preview').update({ status: 'payment_failed', updated_at: new Date().toISOString() }).eq('id', id)
      }
    } catch {}
    const code = e?.code || e?.type || 'charge_failed'
    return res.status(402).json({ error: 'Automatic renewal failed', code, detail: String(e.message || e) })
  }
}
