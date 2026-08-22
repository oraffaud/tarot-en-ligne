import { sendOwnerInvite } from '../../../lib/chatPreviewMail'

export default async function handler(req, res) {
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' })
  }
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const origin = req.headers.origin || `https://${req.headers.host}`
    const ownerUrl = `${origin}/consultante/chat/test-preview-token`
    const result = await sendOwnerInvite({
      ownerUrl,
      customerEmail: 'client-test@example.com',
      startedAt: new Date().toISOString()
    })

    return res.status(200).json({
      ok: true,
      sent: result.sent,
      resend_id: result.id || null,
      reason: result.reason || null,
      to: process.env.CHAT_OWNER_EMAIL || 'lestarotsdenanou@gmail.com'
    })
  } catch (e) {
    console.error('chat owner email test', e)
    return res.status(500).json({
      ok: false,
      error: String(e.message || e)
    })
  }
}
