import crypto from 'crypto'
import { getStripe, getPaymentStore } from '../../../lib/stripeServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.STRIPE_PREMIUM_PRICE_ID) return res.status(500).json({ error: 'Missing STRIPE_PREMIUM_PRICE_ID' })

  try {
    const stripe = getStripe()
    const db = getPaymentStore()
    const origin = req.headers.origin || `https://${req.headers.host}`
    const context = req.body?.context

    if (!context || typeof context.question !== 'string' || !Array.isArray(context.cards) || !context.cards.length) {
      return res.status(400).json({ error: 'Missing reading context' })
    }

    const readingId = crypto.randomUUID()
    const readingContext = {
      question: context.question.trim().slice(0, 2000),
      lang: context.lang === 'en' ? 'en' : 'fr',
      count: [1, 3, 5].includes(context.count) ? context.count : Math.min(context.cards.length, 5),
      cards: context.cards.slice(0, 5).map(card => ({
        name: String(card.name || '').slice(0, 100),
        up: String(card.up || '').slice(0, 500),
        rev: String(card.rev || '').slice(0, 500),
        idx: Number.isInteger(card.idx) ? card.idx : null
      }))
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/premium?session_id={CHECKOUT_SESSION_ID}&reading_id=${encodeURIComponent(readingId)}`,
      cancel_url: `${origin}/?payment=cancelled`,
      customer_creation: 'always',
      allow_promotion_codes: false,
      metadata: { product: 'premium_reading', reading_id: readingId }
    })

    const { error } = await db.from('premium_payments').upsert({
      checkout_session_id: session.id,
      reading_id: readingId,
      reading_context: readingContext,
      customer_id: typeof session.customer === 'string' ? session.customer : null,
      price_id: process.env.STRIPE_PREMIUM_PRICE_ID,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    }, { onConflict: 'checkout_session_id' })

    if (error) throw error
    return res.status(200).json({ url: session.url, reading_id: readingId })
  } catch (e) {
    console.error('stripe create checkout', e)
    return res.status(500).json({ error: 'Unable to create checkout session' })
  }
}
