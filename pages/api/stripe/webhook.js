import { getStripe, getPaymentStore } from '../../../lib/stripeServer'

export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed')
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).end('Missing STRIPE_WEBHOOK_SECRET')

  const stripe = getStripe()
  const signature = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(await readRawBody(req), signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('stripe webhook signature', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const db = getPaymentStore()
    const paid = session.payment_status === 'paid'
    const readingId = session.metadata?.reading_id || null

    if (!readingId) {
      console.error('stripe webhook persistence', new Error('Missing reading_id metadata'))
      return res.status(500).end('Missing reading binding')
    }

    const { data, error } = await db
      .from('premium_payments')
      .update({
        payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        customer_id: typeof session.customer === 'string' ? session.customer : null,
        customer_email: session.customer_details?.email || null,
        price_id: process.env.STRIPE_PREMIUM_PRICE_ID || null,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: paid ? 'paid' : session.payment_status || 'unpaid',
        completed_at: paid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_session_id', session.id)
      .eq('reading_id', readingId)
      .select('id')
      .maybeSingle()

    if (error || !data) {
      console.error('stripe webhook persistence', error || new Error('Checkout session has no bound reading'))
      return res.status(500).end('Persistence error')
    }
  }

  return res.status(200).json({ received: true })
}
