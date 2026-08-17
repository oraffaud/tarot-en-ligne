import { getPaymentStore } from '../../../lib/stripeServer'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const sessionId = String(req.query.session_id || '')
  const readingId = String(req.query.reading_id || '')
  if (!sessionId.startsWith('cs_')) return res.status(400).json({ paid: false, error: 'Invalid session_id' })
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(readingId)) {
    return res.status(400).json({ paid: false, error: 'Invalid reading_id' })
  }

  try {
    const db = getPaymentStore()
    let data = null

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await db
        .from('premium_payments')
        .select('payment_status, customer_email, amount_total, currency, reading_id, reading_context')
        .eq('checkout_session_id', sessionId)
        .eq('reading_id', readingId)
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
      currency: data?.currency || null,
      reading_id: data?.reading_id || null,
      reading_context: data?.payment_status === 'paid' ? data?.reading_context || null : null
    })
  } catch (e) {
    console.error('stripe verify checkout', e)
    return res.status(500).json({ paid: false, error: 'Unable to verify payment' })
  }
}
