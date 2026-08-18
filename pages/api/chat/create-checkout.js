import Stripe from 'stripe'

function getTestStripe() {
  if (process.env.VERCEL_ENV === 'production') throw new Error('Chat preview billing is disabled in production')
  const key = process.env.STRIPE_SECRET_KEY || ''
  if (!key.startsWith('sk_test_')) throw new Error('STRIPE_SECRET_KEY must be a Stripe test secret key in Preview')
  return new Stripe(key)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const priceId = process.env.STRIPE_CHAT_PRICE_ID || ''
    if (!priceId.startsWith('price_')) throw new Error('Missing STRIPE_CHAT_PRICE_ID')

    const stripe = getTestStripe()
    const origin = req.headers.origin || `https://${req.headers.host}`
    const accelerated = req.body?.accelerated === true

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_creation: 'always',
      line_items: [{ price: priceId, quantity: 1 }],
      payment_intent_data: {
        setup_future_usage: 'off_session',
        metadata: { service: 'nanou_chat', billing_block: '1', billing_mode: 'auto_10min' }
      },
      metadata: {
        service: 'nanou_chat',
        billing_block: '1',
        billing_mode: 'auto_10min',
        accelerated: accelerated ? '1' : '0'
      },
      custom_text: {
        submit: {
          message: 'En validant, vous acceptez 39,90 € pour les 10 premières minutes puis 39,90 € par tranche supplémentaire de 10 minutes. Un avertissement est affiché 1 minute avant chaque débit automatique.'
        }
      },
      success_url: `${origin}/api/chat/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/chat-preview?cancelled=1${accelerated ? '&accelerated=1' : ''}`
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('chat create checkout', e)
    return res.status(500).json({ error: String(e.message || e) })
  }
}
