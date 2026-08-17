import { getPaymentStore } from '../../../lib/stripeServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session_id: sessionId = '', reading_id: readingId = '' } = req.body || {}
  if (!String(sessionId).startsWith('cs_')) return res.status(403).json({ error: 'Premium payment required' })
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(readingId))) {
    return res.status(403).json({ error: 'Invalid premium reading' })
  }

  let payment
  try {
    const db = getPaymentStore()
    const result = await db
      .from('premium_payments')
      .select('payment_status, reading_context')
      .eq('checkout_session_id', sessionId)
      .eq('reading_id', readingId)
      .maybeSingle()
    if (result.error) throw result.error
    payment = result.data
  } catch (e) {
    console.error('premium payment lookup', e)
    return res.status(500).json({ error: 'Unable to verify premium access' })
  }

  if (payment?.payment_status !== 'paid' || !payment?.reading_context) {
    return res.status(403).json({ error: 'Premium payment required' })
  }

  const context = payment.reading_context
  const cards = Array.isArray(context.cards) ? context.cards : []
  const question = typeof context.question === 'string' ? context.question : ''
  const lang = context.lang === 'en' ? 'en' : 'fr'
  const MODE = (process.env.AI_MODE || 'auto').toLowerCase()
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const apiKey = process.env.OPENAI_API_KEY || ''

  const sys = lang === 'en'
    ? `You are the voice of Nanou's Tarot, an experienced and compassionate Tarot de Marseille reader. Your reading must feel human, intuitive, warm and subtly mystical, never clinical or mechanical. Speak directly to the person with tact and empathy. Use symbolic language such as energy, path, inner movement, intuition, threshold, invitation, resonance and light when natural. Never claim certainty about the future: say that the cards suggest, invite, illuminate, echo or may indicate. Avoid fatalism, fear, deterministic predictions and dependency. Never give medical, legal or financial advice. Respect Tarot de Marseille names and symbolism. Do not mention AI, JSON, models or technical analysis in the reading.`
    : `Tu es la voix des Tarots de Nanou, tarologue expérimentée, bienveillante et intuitive, spécialisée dans le Tarot de Marseille. La lecture doit être humaine, chaleureuse, empathique et légèrement ésotérique, jamais clinique ni mécanique. Adresse-toi directement à la personne avec tact. Utilise naturellement le vocabulaire de l'énergie, du chemin, de l'intuition, des passages, des résonances, de la lumière et des invitations des cartes. Ne présente jamais l'avenir comme une certitude : écris que les cartes suggèrent, invitent, éclairent, font écho ou peuvent indiquer. Évite le fatalisme, la peur, les prédictions déterministes et toute forme de dépendance. Ne donne aucun conseil médical, juridique ou financier. Respecte les noms et la symbolique du Tarot de Marseille. Ne mentionne jamais l'IA, le JSON, le modèle ou une analyse technique dans la lecture.`

  const spreadSize = Math.max(1, Math.min(5, cards.length))
  const inputCards = cards.slice(0, spreadSize).map(c => ({ name: c?.name || '', upright: c?.up || '', reversed: c?.rev || '' }))
  const labels = spreadSize === 1
    ? (lang === 'en' ? ['Key message'] : ['Message clé'])
    : spreadSize === 3
      ? (lang === 'en' ? ['Past', 'Present', 'Future'] : ['Passé', 'Présent', 'Futur'])
      : (lang === 'en' ? ['Context', 'Challenge', 'Guidance', 'Influences', 'Possible outcome'] : ['Contexte', 'Défi', 'Éclairage', 'Influences', 'Issue possible'])

  const userPrompt = `Question: ${question || (lang === 'en' ? '(no question provided)' : '(aucune question précisée)')}\nSpread: ${spreadSize} cards\nPositions: ${JSON.stringify(labels)}\nCards: ${JSON.stringify(inputCards)}\nLanguage: ${lang}\n\nCreate a personalized Tarot de Marseille reading. Make the narrative flow from one card to the next and connect the cards together instead of treating them as isolated definitions. The emotional tone should feel like a thoughtful consultation with Nanou.\n\nReturn STRICTLY one JSON object with this structure:\n{\n  "title": "short evocative title",\n  "opening": "2-4 warm sentences describing the overall energy and acknowledging the question",\n  "cards": [{"position":"spread position","card":"exact card name","reading":"2-4 flowing sentences explaining what this card may illuminate here","shadow":"one gentle sentence about the tension or point of attention, without alarmism","invitation":"one intimate reflective invitation or question"}],\n  "connections": "2-4 sentences explaining the dialogue/progression between the cards",\n  "message": "2-4 sentences giving the central symbolic message of the spread",\n  "nanou_question": "one beautiful reflective question the person can keep with them",\n  "closing": "1-2 reassuring, open-ended sentences that preserve free will"\n}\n\nDo not include bullet-style business language such as opportunities, cautions, action plan, KPI, synthesis, themes or tone. Do not repeat card dictionary meanings mechanically.`

  async function callResponses() {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: [{ role: 'system', content: sys }, { role: 'user', content: userPrompt }], text: { format: { type: 'json_object' } }, temperature: 0.85 })
    })
    if (!r.ok) throw new Error(`Responses API ${r.status}: ${await r.text()}`)
    const data = await r.json()
    const raw = data?.output?.[0]?.content?.[0]?.text ?? data?.output_text ?? null
    if (!raw) throw new Error('Responses API: empty output')
    return JSON.parse(raw)
  }

  function demoPayload() {
    const demoCards = cards.slice(0, spreadSize).map((c, i) => ({
      position: labels[i] || (lang === 'en' ? `Card ${i + 1}` : `Carte ${i + 1}`),
      card: c?.name || (lang === 'en' ? `Card ${i + 1}` : `Carte ${i + 1}`),
      reading: lang === 'en' ? 'This card invites you to listen to what is quietly taking shape beneath the surface. Its energy suggests a movement that deserves to be welcomed rather than rushed.' : 'Cette carte vous invite à écouter ce qui cherche doucement à prendre forme sous la surface. Son énergie suggère un mouvement qu’il vaut mieux accueillir que précipiter.',
      shadow: lang === 'en' ? 'The point of attention is to avoid forcing an answer before it feels ripe.' : 'Le point d’attention est de ne pas forcer une réponse avant qu’elle ne soit mûre.',
      invitation: lang === 'en' ? 'What becomes clearer when you stop trying to control the outcome?' : 'Qu’est-ce qui devient plus clair lorsque vous cessez de vouloir contrôler l’issue ?'
    }))
    return {
      title: lang === 'en' ? 'A path that asks to be listened to' : 'Un chemin qui demande à être écouté',
      opening: lang === 'en' ? 'There is a quiet but meaningful movement in this spread. The cards do not impose an answer; they invite you to notice what is already resonating within you.' : 'Il se dégage de ce tirage un mouvement discret mais profond. Les cartes n’imposent pas une réponse : elles vous invitent plutôt à reconnaître ce qui résonne déjà en vous.',
      cards: demoCards,
      connections: lang === 'en' ? 'Together, the cards describe a progression from awareness toward a more conscious choice. What first appears uncertain may become clearer once the different energies are allowed to speak to one another.' : 'Ensemble, les cartes racontent un passage de la prise de conscience vers un choix plus aligné. Ce qui semble d’abord incertain peut s’éclairer lorsque les différentes énergies du tirage sont mises en dialogue.',
      message: lang === 'en' ? 'The central invitation is to trust clarity that comes from within rather than from urgency. Your freedom of choice remains at the heart of the reading.' : 'L’invitation centrale est de faire confiance à une clarté qui vient de l’intérieur plutôt qu’à l’urgence. Votre liberté de choix reste au cœur du tirage.',
      nanou_question: lang === 'en' ? 'If you had nothing to prove, what would you choose to listen to today?' : 'Si vous n’aviez rien à prouver, qu’auriez-vous envie d’écouter aujourd’hui ?',
      closing: lang === 'en' ? 'Keep what resonates and leave the rest. Tarot is a mirror, not a sentence.' : 'Gardez ce qui résonne et laissez le reste. Le tarot est un miroir, jamais une sentence.'
    }
  }

  async function compute() {
    if (MODE === 'demo') return { parsed: demoPayload(), meta: { mode: 'demo' } }
    if (MODE === 'live') {
      if (!apiKey) throw new Error('LIVE mode: missing OPENAI_API_KEY')
      return { parsed: await callResponses(), meta: { mode: 'live' } }
    }
    if (!apiKey) return { parsed: demoPayload(), meta: { mode: 'demo', reason: 'no_api_key' } }
    try { return { parsed: await callResponses(), meta: { mode: 'live' } } }
    catch (e) { return { parsed: demoPayload(), meta: { mode: 'demo', reason: String(e).slice(0, 400) } } }
  }

  try {
    const { parsed, meta } = await compute()
    return res.status(200).json({ parsed, meta })
  } catch (e) {
    return res.status(500).json({ error: 'AI request failed', detail: String(e).slice(0, 500) })
  }
}
