import { addMessage, authorizeSession, getChatSessionById, listMessages } from '../../../lib/chatPreviewStore'
import { getPaymentStore } from '../../../lib/stripeServer'

export default async function handler(req, res) {
  try {
    const id = String(req.query.id || req.body?.id || '')
    const token = String(req.query.token || req.body?.token || '')
    const role = String(req.query.role || req.body?.role || 'customer') === 'owner' ? 'owner' : 'customer'
    const session = await getChatSessionById(id)
    if (!authorizeSession(session, token, role)) return res.status(403).json({ error: 'Forbidden' })

    if (req.method === 'GET') {
      const messages = await listMessages(id)
      return res.status(200).json({
        session: {
          id: session.id,
          status: session.status,
          billing_block: session.billing_block,
          amount_paid: session.amount_paid,
          started_at: session.started_at,
          accelerated: session.accelerated,
          customer_email: role === 'owner' ? session.customer_email : undefined
        },
        messages
      })
    }

    if (req.method === 'POST') {
      if (session.status !== 'active') return res.status(409).json({ error: 'Session is not active' })
      const body = String(req.body?.body || '').trim()
      if (!body) return res.status(400).json({ error: 'Empty message' })
      const message = await addMessage(id, role, body)
      return res.status(201).json({ message })
    }

    if (req.method === 'DELETE') {
      const db = getPaymentStore()
      const now = new Date().toISOString()
      const { error } = await db.from('chat_sessions_preview').update({ status: 'ended', ended_at: now, updated_at: now }).eq('id', id)
      if (error) throw error
      return res.status(200).json({ ended: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('chat room api', e)
    return res.status(500).json({ error: String(e.message || e) })
  }
}
