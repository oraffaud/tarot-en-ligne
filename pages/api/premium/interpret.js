export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const PROD = process.env.NODE_ENV === 'production';
  const { cards = [], question = '', lang = 'fr', consent = false } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

  if (process.env.DEMO_MODE === 'true') {
    const spreadSize = Math.max(1, Math.min(5, cards.length));
    const labelsFR = ["Contexte","Défi","Conseil","Influences","Issue"];
    const labelsEN = ["Context","Challenge","Advice","Influences","Outcome"];
    const L = lang === 'en' ? labelsEN : labelsFR;
    const demo = {
      overview: lang==='en' ? "Illustrative reading (demo mode)." : "Lecture illustrative (mode démo).",
      positions: (cards||[]).slice(0,spreadSize).map((c,i)=>({
        label: L[i] || `Carte ${i+1}`,
        card: c?.name || `Carte ${i+1}`,
        keyThemes: ["exemple","démo"],
        opportunities: lang==='en' ? "Positive angle to explore." : "Piste positive à explorer.",
        cautions: lang==='en' ? "Point of caution." : "Point de vigilance."
      })),
      synthesis: lang==='en' ? "Focus on alignment and steady steps." : "Focus sur l’alignement et des pas réguliers.",
      actions_7days: lang==='en' ? ["write one intention","clarify one goal","small concrete step"] : ["noter une intention","clarifier un objectif","petit pas concret"],
      tone: lang==='en' ? "balanced" : "équilibrée"
    };
    const pretty = [
      demo.overview,
      "",
      ...demo.positions.map(p => `• ${p.label} — ${p.card}\n  Thèmes: ${(p.keyThemes||[]).join(', ')}\n  + ${p.opportunities}\n  ! ${p.cautions}`),
      "",
      `Synthèse: ${demo.synthesis}`,
      `Actions (7 jours): ${(demo.actions_7days||[]).map(a=>`- ${a}`).join('\n')}`,
      `Tonalité: ${demo.tone}`
    ].join("\n");
    return res.status(200).json({ parsed: demo, pretty });
  }

  const sys = lang === 'en'
    ? "You are a professional tarot reader. Produce a careful, ethical, structured analysis. NEVER give medical/financial/legal advice."
    : "Tu es un(e) tarologue professionnel(le). Donne une analyse structurée et prudente. NE FOURNIS PAS de conseils médicaux/financiers/juridiques.";

  const spreadSize = Math.max(1, Math.min(5, cards.length));
  const inputCards = cards.slice(0, spreadSize).map(c => ({
    name: c?.name || '',
    upright: c?.up || '',
    reversed: c?.rev || ''
  }));

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
        text: { format: { type: "json_object" } },
        temperature: 0.6
      })
    });
    if (!r.ok) throw new Error(`Responses API ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const raw = data?.output?.[0]?.content?.[0]?.text ?? data?.output_text ?? null;
    if (!raw) throw new Error('Responses API: sortie vide/non reconnue');
    return raw;
  }

  let raw;
  try {
    raw = await callResponses();
  } catch (e1) {
    return res.status(500).json({
      error: 'AI request failed (Responses)',
      ...(PROD ? {} : { detail: String(e1).slice(0,1000) })
    });
  }

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch {
    parsed = { overview: raw, positions: [], synthesis: "", actions_7days: [], tone: "" };
  }

  if (consent && process.env.LOG_TO_DISK !== 'false') {
    try {
      const fs = await import('fs');
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        lang, question, cards: inputCards, model, parsed
      }) + '\n';
      fs.appendFileSync('data/premium_logs.jsonl', line, 'utf8');
    } catch {}
  }

  const pretty = [
    parsed.overview ?? '',
    '',
    ...(parsed.positions || []).map(p => `• ${p.label} — ${p.card}\n  Thèmes: ${(p.keyThemes||[]).join(', ')}\n  + ${p.opportunities || ''}\n  ! ${p.cautions || ''}`),
    '',
    `Synthèse: ${parsed.synthesis || ''}`,
    `Actions (7 jours): ${(parsed.actions_7days||[]).map(a=>`- ${a}`).join('\n')}`,
    `Tonalité: ${parsed.tone || ''}`
  ].join('\n');

  return res.status(200).json({ parsed, pretty });
}
