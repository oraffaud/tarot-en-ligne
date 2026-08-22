export async function sendOwnerInvite({ ownerUrl, customerEmail, startedAt }) {
  const to = process.env.CHAT_OWNER_EMAIL || 'lestarotsdenanou@gmail.com'
  const apiKey = process.env.RESEND_API_KEY || ''
  const from = process.env.CHAT_EMAIL_FROM || 'Les Tarots de Nanou <chat@interface-trust.com>'

  if (!apiKey) {
    console.warn('CHAT OWNER INVITE (email disabled - missing RESEND_API_KEY)', { to, ownerUrl })
    return { sent: false, reason: 'missing_resend_key' }
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#24142f">
      <h1>Nouvelle consultation privée</h1>
      <p>Un client vient de régler sa première tranche de 10 minutes.</p>
      <p><strong>Client :</strong> ${escapeHtml(customerEmail || 'E-mail non disponible')}</p>
      <p><strong>Début :</strong> ${escapeHtml(new Date(startedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))}</p>
      <p style="margin:28px 0"><a href="${ownerUrl}" style="background:#2b1739;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px">Rejoindre la consultation</a></p>
      <p style="font-size:12px;color:#6b5a72">Ce lien est privé. Ne le transférez pas.</p>
    </div>`

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: 'Nouvelle consultation privée — Les Tarots de Nanou', html })
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Owner email failed: ${data.message || r.status}`)
  return { sent: true, id: data.id }
}

function escapeHtml(v) {
  return String(v).replace(/[&<>'\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]))
}
