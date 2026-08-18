import Stripe from 'stripe'

function getTestStripe() {
  if (process.env.VERCEL_ENV === 'production') throw new Error('Chat preview billing is disabled in production')
  const key = process.env.STRIPE_CHAT_SECRET_KEY || ''
  if (!key.startsWith('sk_test_')) throw new Error('STRIPE_CHAT_SECRET_KEY must be a Stripe test secret key')
  return new Stripe(key)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session_id: sessionId = '', block = 2 } = req.body || {}
  if (!String(sessionId).startsWith('cs_test_')) return res.status(400).json({ error: 'Invalid test Checkout session' })

  try {
    const stripe = getTestStripe()
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.payment_method'] })
    if (checkout.payment_status !== 'paid') return res.status(402).json({ error: 'Initial chat payment is not paid' })

    const customer = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id
    const paymentIntent = checkout.payment_intent
    const paymentMethod = typeof paymentIntent?.payment_method === 'string' ? paymentIntent.payment_method : paymentIntent?.payment_method?.id
    if (!customer || !paymentMethod) throw new Error('Saved customer/payment method not available')

    const n = Math.max(2, Number.parseInt(block, 10) || 2)
    const intent = await stripe.paymentIntents.create({
      amount: 3990,
      currency: 'eur',
      customer,
      payment_method: paymentMethod,
      off_session: true,
      confirm: true,
      description: `Consultation privée avec Nanou — tranche ${n} de 10 minutes`,
      metadata: {
        service: 'nanou_chat',
        source_checkout_session: sessionId,
        billing_block: String(n),
        billing_mode: 'auto_10min'
      }
    }, { idempotencyKey: `nanou-chat-${sessionId}-block-${n}` })

    return res.status(200).json({ paid: intent.status === 'succeeded', status: intent.status, payment_intent_id: intent.id, block: n })
  } catch (e) {
    console.error('chat automatic renewal', e)
    const code = e?.code || e?.type || 'charge_failed'
    return res.status(402).json({ error: 'Automatic renewal failed', code, detail: String(e.message || e) })
  }
}
