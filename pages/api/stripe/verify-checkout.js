import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const sessionId = String(req.query.session_id || '')
  if (!sessionId) return res.status(400).json({ error: 'Missing session_id' })
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' })

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const paid = session.payment_status === 'paid' && session.status === 'complete'
    return res.status(200).json({
      paid,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email || null
    })
  } catch (e) {
    console.error('stripe verify checkout', e)
    return res.status(400).json({ paid: false, error: 'Invalid session' })
  }
}
