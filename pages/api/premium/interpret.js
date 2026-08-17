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
    ? `You are Nanou, an experienced Tarot de Marseille reader. This is a paid Premium consultation, so the client must feel they are receiving a beautiful, intimate and genuinely personalized reading rather than a generic card summary.

Your voice is elegant, warm, feminine, intuitive and subtly mysterious. Write like a gifted reader speaking softly across a candlelit table: evocative but clear, sensual in the literary sense but never sexual, emotionally intelligent and never kitsch. Create atmosphere through images of thresholds, light, movement, seasons, currents, echoes, doors, inner landscapes and quiet intuitions, but use them sparingly enough that the reading remains credible.

Start from the client's actual question and keep returning to it. Read the spread as a living whole: notice contrasts, repetitions, progressions, tensions and alliances between cards. A card's meaning changes according to its position and its dialogue with the others. Avoid dictionary-like definitions.

Give substance. The Premium reading should feel generous and layered. Explain what may be happening beneath the obvious surface, what is asking to evolve, what deserves attention, and where a possible opening lies. Offer concrete emotional or relational insight when the question supports it, while staying within what the cards can symbolically suggest.

Never claim certainty about the future. Use language such as 'the cards suggest', 'this may indicate', 'it feels as though', 'the spread invites you to notice'. Preserve free will. Do not use fear, fatalism, dependency, supernatural certainty, medical/legal/financial advice, or claims that someone secretly thinks or feels something as a fact. Do not mention AI, models, JSON or technical analysis.`
    : `Tu es Nanou, tarologue expérimentée spécialisée dans le Tarot de Marseille. Il s'agit d'une consultation Premium payante : la personne doit avoir la sensation de recevoir une lecture belle, intime, riche et véritablement personnalisée, et non un résumé générique de la signification des cartes.

Ta voix est élégante, chaleureuse, féminine, intuitive et subtilement mystérieuse. Écris comme une excellente tarologue qui parlerait doucement de l'autre côté d'une table éclairée à la bougie : évocatrice mais précise, enveloppante sans être mièvre, poétique sans tomber dans le cliché ésotérique. Tu peux faire naître une atmosphère avec des images de seuils, de lumière, de mouvement, de saisons, de courants, d'échos, de portes, de paysages intérieurs et d'intuition, mais avec mesure pour conserver une lecture crédible.

Pars toujours de la question réellement posée et reviens-y régulièrement. Lis le tirage comme un ensemble vivant : observe les contrastes, répétitions, progressions, tensions et alliances entre les cartes. La signification d'une lame dépend de sa position et du dialogue avec les autres. Ne récite jamais un dictionnaire du tarot.

Donne de la matière. La lecture Premium doit sembler généreuse et profonde. Fais émerger ce qui peut se jouer sous la surface, ce qui demande à évoluer, ce qui mérite d'être regardé avec lucidité et l'ouverture possible que le tirage laisse entrevoir. Lorsque la question s'y prête, apporte une lecture émotionnelle ou relationnelle concrète, tout en restant dans ce que les cartes peuvent symboliquement suggérer.

Ne présente jamais l'avenir comme une certitude. Utilise des formulations comme « les cartes suggèrent », « cette lame peut indiquer », « le tirage donne le sentiment que », « il vous invite à observer ». Préserve toujours le libre arbitre. Pas de peur, de fatalisme, de dépendance, de certitude surnaturelle, de conseil médical/juridique/financier, ni d'affirmation factuelle sur les pensées ou sentiments secrets d'un tiers. Ne mentionne jamais l'IA, le modèle, le JSON ou une analyse technique.`

  const spreadSize = Math.max(1, Math.min(5, cards.length))
  const inputCards = cards.slice(0, spreadSize).map(c => ({ name: c?.name || '', upright: c?.up || '', reversed: c?.rev || '' }))
  const labels = spreadSize === 1
    ? (lang === 'en' ? ['Key message'] : ['Message clé'])
    : spreadSize === 3
      ? (lang === 'en' ? ['Past', 'Present', 'Future'] : ['Passé', 'Présent', 'Futur'])
      : (lang === 'en' ? ['Context', 'Challenge', 'Guidance', 'Influences', 'Possible outcome'] : ['Contexte', 'Défi', 'Éclairage', 'Influences', 'Issue possible'])

  const userPrompt = lang === 'en'
    ? `Client's question: ${question || '(no question provided)'}\nSpread: ${spreadSize} cards\nPositions: ${JSON.stringify(labels)}\nCards: ${JSON.stringify(inputCards)}\n\nCompose Nanou's Premium Tarot de Marseille reading. This must feel worth paying for: immersive, nuanced, specific to this question and emotionally resonant. Avoid generic self-help language.\n\nWriting requirements:\n- Give the reading an evocative title that reflects the particular tension or movement of THIS spread.\n- Opening: 4-6 flowing sentences. Set the atmosphere, name the overall dynamic and directly acknowledge the question.\n- For EACH card: write 5-7 substantial sentences. Explain why this card matters in this precise position, relate it to the question, then connect it to at least one other card where relevant. Include nuance and ambiguity rather than one-dimensional meanings.\n- The 'shadow' is not a warning label: make it 2-3 elegant sentences about the subtle tension, blind spot or inner resistance suggested by the card.\n- The 'invitation' should be an intimate, precise reflective question, not a generic coaching prompt.\n- Connections: 5-8 sentences telling the story created by the sequence of cards. This is the heart of the Premium reading.\n- Central message: 4-6 sentences that crystallize what the spread is illuminating without predicting the future.\n- Nanou's question: one memorable sentence the client may want to keep.\n- Closing: 2-4 warm sentences, elegant and open-ended.\n\nVary sentence length. Avoid repeating 'energy', 'invitation', 'clarity' and 'movement' excessively. Do not use bullet-point business vocabulary, action plans, KPIs, generic affirmations or canned phrases.\n\nReturn STRICTLY one JSON object with this structure:\n{\n  "title": "evocative personalized title",\n  "opening": "rich opening",\n  "cards": [{"position":"spread position","card":"exact card name","reading":"rich flowing interpretation","shadow":"subtle point of tension","invitation":"intimate reflective question"}],\n  "connections": "deep narrative linking all cards",\n  "message": "central symbolic message",\n  "nanou_question": "memorable reflective question",\n  "closing": "warm open-ended closing"\n}`
    : `Question de la personne : ${question || '(aucune question précisée)'}\nTirage : ${spreadSize} carte(s)\nPositions : ${JSON.stringify(labels)}\nCartes : ${JSON.stringify(inputCards)}\n\nCompose la Lecture Premium de Nanou avec le Tarot de Marseille. Elle doit donner le sentiment d'une vraie consultation : immersive, nuancée, précise par rapport à cette question et émotionnellement juste. Évite absolument le développement personnel générique.\n\nExigences d'écriture :\n- Donne au tirage un titre évocateur qui reflète la tension ou le mouvement particulier de CE tirage.\n- Ouverture : 4 à 6 phrases fluides. Installe une atmosphère, nomme la dynamique générale et fais directement écho à la question posée.\n- Pour CHAQUE carte : 5 à 7 phrases substantielles. Explique pourquoi cette lame est importante à cette place précise, relie-la à la question, puis mets-la en résonance avec au moins une autre carte lorsque c'est pertinent. Fais apparaître les nuances et les ambivalences plutôt qu'une signification unique.\n- « L'ombre » n'est pas un avertissement : écris 2 à 3 phrases élégantes sur la tension subtile, l'angle mort ou la résistance intérieure que la carte peut révéler.\n- « L'invitation » doit être une question intime et précise, directement inspirée de la carte et de la question, jamais une formule de coaching générique.\n- « Le fil entre les cartes » : 5 à 8 phrases qui racontent réellement l'histoire créée par leur succession. C'est le cœur de la lecture Premium.\n- « Le message du tirage » : 4 à 6 phrases qui cristallisent ce que le tirage met en lumière sans prédire l'avenir.\n- La question de Nanou : une seule phrase mémorable que la personne pourrait avoir envie de garder avec elle.\n- Conclusion : 2 à 4 phrases chaleureuses, élégantes et ouvertes.\n\nVarie la longueur des phrases et le rythme. N'abuse pas des mots « énergie », « invitation », « clarté », « mouvement », « alignement » ou « résonance ». Évite les listes, les plans d'action, le vocabulaire de consultant, les banalités de développement personnel, les affirmations toutes faites et les répétitions mécaniques de la signification des cartes.\n\nRetourne STRICTEMENT un unique objet JSON avec cette structure :\n{\n  "title": "titre évocateur et personnalisé",\n  "opening": "ouverture riche",\n  "cards": [{"position":"position du tirage","card":"nom exact de la carte","reading":"interprétation riche et fluide","shadow":"tension subtile","invitation":"question intime"}],\n  "connections": "récit profond reliant toutes les cartes",\n  "message": "message symbolique central",\n  "nanou_question": "question mémorable",\n  "closing": "conclusion chaleureuse et ouverte"\n}`

  async function callResponses() {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: [{ role: 'system', content: sys }, { role: 'user', content: userPrompt }], text: { format: { type: 'json_object' } }, temperature: 0.92 })
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
      reading: lang === 'en'
        ? 'This card does not arrive here by accident: in this position, it seems to illuminate what has been quietly forming beneath the surface of your question. There is something both delicate and insistent in its presence, as if one part of you already senses the direction while another still hesitates to name it. Rather than demanding an immediate decision, the card asks you to observe what changes when you stop pushing for certainty. Its meaning becomes richer in the company of the other cards, which suggest that this is less about forcing an outcome than recognizing a transition already underway. What matters here is not speed, but the quality of attention you bring to what is emerging.'
        : 'Cette lame n’arrive pas ici par hasard : à cette place, elle semble éclairer ce qui se forme discrètement sous la surface de votre question. Il y a quelque chose de délicat et pourtant insistant dans sa présence, comme si une part de vous pressentait déjà une direction tandis qu’une autre hésite encore à la nommer. Plutôt que d’exiger une décision immédiate, la carte vous invite à observer ce qui change lorsque vous cessez de chercher une certitude absolue. Son sens se nuance au contact des autres lames, qui donnent le sentiment qu’il s’agit moins de forcer une issue que de reconnaître un passage déjà engagé. Ici, l’essentiel n’est peut-être pas d’aller vite, mais de regarder avec justesse ce qui cherche à émerger.',
      shadow: lang === 'en'
        ? 'The delicate point is the temptation to ask the card for a definitive answer before the situation has finished revealing itself. Too much control could drown out the quieter signal already present.'
        : 'Le point délicat tient à la tentation de demander à la carte une réponse définitive avant que la situation ait fini de se révéler. Trop vouloir maîtriser l’issue pourrait couvrir le signal plus discret qui est déjà là.',
      invitation: lang === 'en'
        ? 'If you stopped asking what you should decide for a moment, what would you admit you already feel?'
        : 'Si vous cessiez un instant de vous demander ce que vous devez décider, qu’admettriez-vous que vous ressentez déjà ?'
    }))
    return {
      title: lang === 'en' ? 'Where the path begins to reveal itself' : 'Là où le chemin commence à se dévoiler',
      opening: lang === 'en'
        ? 'There is a quiet intensity in this spread, the feeling of a situation that has not yet said its final word. Your question seems to sit at a threshold: something familiar is still present, yet another possibility is beginning to ask for space. The cards do not push you toward a verdict. They invite you to look more closely at what is changing beneath your first impression, and at the part of you that may already know more than it dares to say.'
        : 'Il y a dans ce tirage une intensité discrète, la sensation d’une situation qui n’a pas encore livré son dernier mot. Votre question semble se tenir sur un seuil : quelque chose de familier est encore là, tandis qu’une autre possibilité commence à demander sa place. Les cartes ne vous poussent pas vers un verdict. Elles vous proposent plutôt de regarder ce qui se transforme sous la première impression, et cette part de vous qui sait peut-être déjà davantage qu’elle n’ose se l’avouer.',
      cards: demoCards,
      connections: lang === 'en'
        ? 'Taken together, the cards form less a list of meanings than a small story. The first opens a question, the next complicates it, and the final movement suggests that the answer may not lie where you initially expected it. A tension runs through the spread between what feels safe and what feels alive. This does not necessarily ask for a dramatic break; it may be describing a subtler change in the way you position yourself. The most interesting point is the dialogue between hesitation and desire: neither needs to be silenced, because each is carrying useful information. The spread seems to become clearer when you allow both voices to exist before choosing what deserves to lead.'
        : 'Ensemble, les cartes forment moins une liste de significations qu’une petite histoire. La première ouvre une question, la suivante la complexifie, et le mouvement final laisse entendre que la réponse ne se trouve peut-être pas exactement là où vous l’attendiez. Une tension traverse le tirage entre ce qui rassure et ce qui semble plus vivant. Il ne s’agit pas nécessairement d’une rupture spectaculaire : les lames peuvent décrire un déplacement plus subtil dans votre manière de vous positionner. Le point le plus intéressant se situe dans le dialogue entre l’hésitation et le désir : aucun des deux n’a besoin d’être réduit au silence, car chacun porte une information utile. Le tirage semble gagner en netteté lorsque vous laissez ces deux voix exister avant de décider laquelle mérite de guider la suite.',
      message: lang === 'en'
        ? 'The central message is not to hurry toward certainty simply to end the discomfort of not knowing. This spread suggests that something important is being clarified through the very tension you are experiencing. What looks like indecision may partly be discernment still doing its work. Give yourself permission to notice which possibility expands you and which one merely reassures you. Your choice remains yours; the cards are simply placing a little more light around it.'
        : 'Le message central n’est pas de vous précipiter vers une certitude simplement pour faire taire l’inconfort du doute. Ce tirage suggère que quelque chose d’important est justement en train de se préciser à travers la tension que vous ressentez. Ce qui ressemble à de l’indécision peut aussi être un discernement encore à l’œuvre. Accordez-vous le droit d’observer quelle possibilité vous ouvre intérieurement et laquelle ne fait que vous rassurer. Le choix reste le vôtre ; les cartes ne font qu’y déposer un peu plus de lumière.',
      nanou_question: lang === 'en'
        ? 'Which truth would become easier to hear if you no longer had to justify it to anyone?'
        : 'Quelle vérité deviendrait plus facile à entendre si vous n’aviez plus besoin de la justifier auprès de personne ?',
      closing: lang === 'en'
        ? 'Let this reading settle rather than trying to solve it all at once. Keep what touches something true in you, and allow the rest to remain quiet for now.'
        : 'Laissez cette lecture se déposer plutôt que de vouloir tout résoudre immédiatement. Gardez ce qui touche quelque chose de juste en vous, et laissez le reste demeurer silencieux pour le moment.'
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
