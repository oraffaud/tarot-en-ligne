import { getChatSessionById, authorizeSession } from '../../../lib/chatPreviewStore'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id = '', token = '', target_lang: targetLang = 'fr', messages = [] } = req.body || {}
  if (!id || !token) return res.status(400).json({ error: 'Missing chat credentials' })
  if (!Array.isArray(messages) || messages.length === 0) return res.status(200).json({ translations: {} })

  try {
    const session = await getChatSessionById(String(id))
    if (!authorizeSession(session, String(token), 'owner')) return res.status(403).json({ error: 'Unauthorized' })

    const apiKey = process.env.OPENAI_API_KEY || ''
    if (!apiKey) return res.status(500).json({ error: 'Translation service unavailable' })

    const lang = targetLang === 'en' ? 'English' : 'French'
    const batch = messages.slice(0, 20).map(m => ({
      id: String(m.id || ''),
      text: String(m.body || '').slice(0, 4000)
    })).filter(m => m.id && m.text)

    if (!batch.length) return res.status(200).json({ translations: {} })

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const prompt = `Translate each client chat message into ${lang}. Preserve the exact meaning, tone, names, emojis, dates and any ambiguity. Do not summarize, embellish, answer, interpret or censor. If a message is already in ${lang}, return it unchanged. Return STRICTLY one JSON object whose keys are the supplied message ids and whose values are the translations.\n\nMessages: ${JSON.stringify(batch)}`

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: 'You are a precise real-time chat translator. Translate only; never add commentary.' },
          { role: 'user', content: prompt }
        ],
        text: { format: { type: 'json_object' } }
      })
    })

    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`)
    const data = await r.json()
    const raw = data?.output?.[0]?.content?.[0]?.text ?? data?.output_text ?? '{}'
    const parsed = JSON.parse(raw)
    const translations = {}
    for (const m of batch) {
      if (typeof parsed?.[m.id] === 'string') translations[m.id] = parsed[m.id]
    }

    return res.status(200).json({ translations })
  } catch (e) {
    console.error('chat translate', e)
    return res.status(500).json({ error: 'Unable to translate messages' })
  }
}
