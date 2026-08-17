import { getPaymentStore } from '../../../lib/stripeServer'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const sessionId = String(req.query.session_id || '')
  if (!sessionId.startsWith('cs_')) return res.status(400).json({ paid: false, error: 'Invalid session_id' })

  try {
    const db = getPaymentStore()
    let data = null

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await db
        .from('premium_payments')
        .select('payment_status, customer_email, amount_total, currency')
        .eq('checkout_session_id', sessionId)
        .maybeSingle()

      if (result.error) throw result.error
      data = result.data
      if (data?.payment_status === 'paid') break
      if (attempt < 7) await sleep(500)
    }

    return res.status(200).json({
      paid: data?.payment_status === 'paid',
      payment_status: data?.payment_status || 'pending',
      customer_email: data?.customer_email || null,
      amount_total: data?.amount_total || null,
      currency: data?.currency || null
    })
  } catch (e) {
    console.error('stripe verify checkout', e)
    return res.status(500).json({ paid: false, error: 'Unable to verify payment' })
  }
}
