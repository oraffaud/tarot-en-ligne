import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = req.headers.origin || `https://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: 1900,
          product_data: {
            name: 'Lecture Premium — Les Tarots de Nanou',
            description: 'Lecture complète et personnalisée de votre tirage'
          }
        },
        quantity: 1
      }],
      success_url: `${origin}/premium?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      allow_promotion_codes: false
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('stripe create checkout', e)
    return res.status(500).json({ error: 'Unable to create checkout session' })
  }
}
