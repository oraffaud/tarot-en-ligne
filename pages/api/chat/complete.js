import Stripe from 'stripe'
import { createChatSession, publicOrigin } from '../../../lib/chatPreviewStore'
import { sendOwnerInvite } from '../../../lib/chatPreviewMail'
import { getPaymentStore } from '../../../lib/stripeServer'

function getTestStripe() {
  if (process.env.VERCEL_ENV === 'production') throw new Error('Chat preview billing is disabled in production')
  const key = process.env.STRIPE_SECRET_KEY || ''
  if (!key.startsWith('sk_test_')) throw new Error('STRIPE_SECRET_KEY must be a Stripe test secret key in Preview')
  return new Stripe(key)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method not allowed')
  try {
    const sessionId = String(req.query.session_id || '')
    if (!sessionId.startsWith('cs_test_')) throw new Error('Invalid test Checkout session')

    const stripe = getTestStripe()
    const checkout = await stripe.checkout.sessions.retrieve(sessionId)
    if (checkout.payment_status !== 'paid') throw new Error('Chat payment is not paid')

    const accelerated = checkout.metadata?.accelerated === '1'
    const room = await createChatSession({ checkout, accelerated })
    const origin = publicOrigin(req)
    const ownerUrl = `${origin}/consultante/chat/${room.id}?token=${encodeURIComponent(room.owner_token)}`
    const customerUrl = `${origin}/chat/${room.id}?token=${encodeURIComponent(room.customer_token)}${accelerated ? '&accelerated=1' : ''}`

    if (!room.owner_notified_at) {
      try {
        const result = await sendOwnerInvite({ ownerUrl, customerEmail: room.customer_email, startedAt: room.started_at })
        if (result.sent) {
          const db = getPaymentStore()
          await db.from('chat_sessions_preview').update({ owner_notified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', room.id)
        }
      } catch (mailError) {
        console.error('owner invite email', mailError)
      }
    }

    const previewOwner = process.env.VERCEL_ENV !== 'production' ? `&owner_preview=${encodeURIComponent(ownerUrl)}` : ''
    return res.redirect(303, `${customerUrl}${previewOwner}`)
  } catch (e) {
    console.error('chat complete', e)
    return res.status(500).send(`Unable to create chat room: ${String(e.message || e)}`)
  }
}
