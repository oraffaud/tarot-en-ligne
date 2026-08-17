import { getStripe, getPaymentStore } from '../../../lib/stripeServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.STRIPE_PREMIUM_PRICE_ID) {
    return res.status(500).json({ error: 'Missing STRIPE_PREMIUM_PRICE_ID' })
  }

  try {
    const stripe = getStripe()
    const db = getPaymentStore()
    const origin = req.headers.origin || `https://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/premium?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      customer_creation: 'always',
      allow_promotion_codes: false,
      metadata: { product: 'premium_reading' }
    })

    const { error } = await db.from('premium_payments').upsert({
      checkout_session_id: session.id,
      customer_id: typeof session.customer === 'string' ? session.customer : null,
      price_id: process.env.STRIPE_PREMIUM_PRICE_ID,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    }, { onConflict: 'checkout_session_id' })

    if (error) throw error
    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('stripe create checkout', e)
    return res.status(500).json({ error: 'Unable to create checkout session' })
  }
}
