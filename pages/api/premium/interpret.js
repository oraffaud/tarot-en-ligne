export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cards = [], question = '', lang = 'fr' } = req.body || {};
  const MODE = (process.env.AI_MODE || 'auto').toLowerCase(); // auto | live | demo
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.OPENAI_API_KEY || '';

  const sys = lang === 'en'
    ? "You are a professional tarot reader. Produce a careful, ethical, structured analysis. NEVER give medical/financial/legal advice."
    : "Tu es un(e) tarologue professionnel(le). Donne une analyse structurée et prudente. NE FOURNIS PAS de conseils médicaux/financiers/juridiques.";

  const spreadSize = Math.max(1, Math.min(5, cards.length));
  const inputCards = cards.slice(0, spreadSize).map(c => ({
    name: c?.name || '',
    upright: c?.up || '',
    reversed: c?.rev || ''
  }));

  const userPrompt =
    `Cards: ${JSON.stringify(inputCards)}; Question: ${question || '(none)'}; ` +
    `Language: ${lang}; Spread: ${spreadSize}. ` +
    `Please answer STRICTLY as a JSON object with keys: overview (string), positions (array[{label,card,keyThemes[],opportunities,cautions}]), synthesis (string), actions_7days (array[string]), tone (string).`;

  async function callResponses() {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: sys },
          { role: 'user', content: userPrompt }
        ],
        text: { format: { type: 'json_object' } },
        temperature: 0.6
      })
    });
    if (!r.ok) throw new Error(`Responses API ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const raw = data?.output?.[0]?.content?.[0]?.text ?? data?.output_text ?? null;
    if (!raw) throw new Error('Responses API: empty output');
    return JSON.parse(raw);
  }

  function demoPayload() {
    const L = lang === 'en'
      ? ["Context","Challenge","Advice","Influences","Outcome"]
      : ["Contexte","Défi","Conseil","Influences","Issue"];
    const positions = (cards||[]).slice(0, spreadSize).map((c,i)=>({
      label: L[i] || (lang==='en' ? `Card ${i+1}` : `Carte ${i+1}`),
      card: c?.name || (lang==='en' ? `Card ${i+1}` : `Carte ${i+1}`),
      keyThemes: ["example","demo"],
      opportunities: lang==='en' ? "Positive angle to explore." : "Piste positive à explorer.",
      cautions: lang==='en' ? "Point of caution." : "Point de vigilance."
    }));
    return {
      overview: lang==='en' ? "Illustrative reading (demo mode)." : "Lecture illustrative (mode démo).",
      positions,
      synthesis: lang==='en' ? "Focus on alignment and steady steps." : "Focus sur l’alignement et des pas réguliers.",
      actions_7days: lang==='en'
        ? ["write one intention","clarify one goal","small concrete step"]
        : ["noter une intention","clarifier un objectif","petit pas concret"],
      tone: lang==='en' ? "balanced" : "équilibrée"
    };
  }

  async function compute() {
    if (MODE === 'demo') return { parsed: demoPayload(), meta: { mode: 'demo' } };
    if (MODE === 'live') {
      if (!apiKey) throw new Error('LIVE mode: missing OPENAI_API_KEY');
      const parsed = await callResponses(); return { parsed, meta: { mode: 'live' } };
    }
    if (!apiKey) return { parsed: demoPayload(), meta: { mode: 'demo', reason: 'no_api_key' } };
    try { const parsed = await callResponses(); return { parsed, meta: { mode: 'live' } };
    } catch (e) { return { parsed: demoPayload(), meta: { mode: 'demo', reason: String(e).slice(0,400) } }; }
  }

  const { parsed, meta } = await compute();
  const pretty = [
    parsed.overview ?? '',
    '',
    ...(parsed.positions || []).map(p => `• ${p.label} — ${p.card}\n  Thèmes: ${(p.keyThemes||[]).join(', ')}\n  + ${p.opportunities || ''}\n  ! ${p.cautions || ''}`),
    '',
    `Synthèse: ${parsed.synthesis || ''}`,
    `Actions (7 jours): ${(parsed.actions_7days||[]).map(a=>`- ${a}`).join('\n')}`,
    `Tonalité: ${parsed.tone || ''}`,
    meta?.mode ? `\n[mode=${meta.mode}${meta.reason ? `, reason=${meta.reason}`:''}]` : ''
  ].join('\n');

  return res.status(200).json({ parsed, pretty, meta });
}
