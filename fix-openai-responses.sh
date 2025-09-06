#!/usr/bin/env bash
set -e
mkdir -p .backup_tarot/pages_api_premium
cp pages/api/premium/interpret.js ".backup_tarot/pages_api_premium/interpret.js.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

cat > pages/api/premium/interpret.js <<'JS'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const PROD = process.env.NODE_ENV === 'production';
  const { cards = [], question = '', lang = 'fr', consent = false } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing OPENAI_API_KEY',
      ...(PROD ? {} : { detail: 'Ajoute OPENAI_API_KEY dans .env.local (dev) et dans Vercel (prod/preview).' })
    });
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

  // ---- Responses API ----
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
        response_format: { type: 'json_object' },
        temperature: 0.6
      })
    });
    if (!r.ok) throw new Error(`Responses API ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const raw =
      data?.output?.[0]?.content?.[0]?.text ??
      data?.output_text ??
      null;
    if (!raw) throw new Error('Responses API: sortie vide/non reconnue');
    return raw;
  }

  // ---- Fallback Chat API ----
  async function callChat() {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' }
      })
    });
    if (!r.ok) throw new Error(`Chat API ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? null;
    if (!raw) throw new Error('Chat API: sortie vide/non reconnue');
    return raw;
  }

  let raw;
  try {
    raw = await callResponses();
  } catch (e1) {
    try {
      raw = await callChat();
    } catch (e2) {
      return res.status(500).json({
        error: 'AI request failed',
        ...(PROD ? {} : { detail: `Responses error: ${String(e1).slice(0,500)} | Chat error: ${String(e2).slice(0,500)}` })
      });
    }
  }

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) {
    if (!PROD) console.error('JSON parse error:', e, raw);
    parsed = { overview: raw, positions: [], synthesis: "", actions_7days: [], tone: "" };
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
JS

echo "✅ Correctif appliqué : suppression de 'modalities', usage response_format uniquement."
