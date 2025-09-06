#!/usr/bin/env bash
set -e

mkdir -p .backup_tarot pages/api/premium lib data

STAMP="$(date +%Y%m%d_%H%M%S)"

# 1) Page Premium (UI complète)
cat > pages/premium.js <<'JS'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

// Jeu (RWS)
const MAJOR_ARCANA = [
  { name: "Le Mat (0)", up: "Nouveaux départs, foi", rev: "Imprudence, naïveté" },
  { name: "Le Magicien (I)", up: "Volonté, ressources", rev: "Manipulation, illusions" },
  { name: "La Papesse (II)", up: "Intuition, mystère", rev: "Secrets, blocage" },
  { name: "L’Impératrice (III)", up: "Abondance, soin", rev: "Dépendance, stagnation" },
  { name: "L’Empereur (IV)", up: "Structure, autorité", rev: "Rigidité, domination" },
  { name: "Le Pape (V)", up: "Tradition, guidance", rev: "Dogmatisme, rébellion" },
  { name: "Les Amoureux (VI)", up: "Choix, harmonie", rev: "Dissonance, doute" },
  { name: "Le Chariot (VII)", up: "Volonté, progrès", rev: "Dispersion, indécision" },
  { name: "La Force (VIII)", up: "Courage, maîtrise", rev: "Insécurité, impulsivité" },
  { name: "L’Hermite (IX)", up: "Recherche, sagesse", rev: "Isolement, fuite" },
  { name: "La Roue de Fortune (X)", up: "Cycles, tournant", rev: "Résistance au changement" },
  { name: "La Justice (XI)", up: "Équité, vérité", rev: "Injustice, déséquilibre" },
  { name: "Le Pendu (XII)", up: "Lâcher-prise, regard neuf", rev: "Blocage, stagnation" },
  { name: "La Mort (XIII)", up: "Transformation", rev: "Attachement, peur" },
  { name: "Tempérance (XIV)", up: "Modération, alchimie", rev: "Excès, impatience" },
  { name: "Le Diable (XV)", up: "Attachements, matérialisme", rev: "Libération" },
  { name: "La Tour (XVI)", up: "Révélation, rupture", rev: "Retard du nécessaire" },
  { name: "L’Étoile (XVII)", up: "Espoir, inspiration", rev: "Doute" },
  { name: "La Lune (XVIII)", up: "Rêves, intuition", rev: "Confusion, peur" },
  { name: "Le Soleil (XIX)", up: "Joie, clarté", rev: "Arrogance" },
  { name: "Le Jugement (XX)", up: "Réveil, bilan", rev: "Auto-critique, hésitation" },
  { name: "Le Monde (XXI)", up: "Accomplissement, unité", rev: "Boucle inachevée" },
];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const drawCards = (count) =>
  shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx }))).slice(0, count);

export default function Premium() {
  const [count, setCount] = useState(5);
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState("");
  const [lang, setLang] = useState("fr");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCards(drawCards(count));
  }, []); // 1er rendu

  const options = useMemo(() => ([
    { id: 1, label: lang==='en' ? "1 card" : "1 carte" },
    { id: 3, label: lang==='en' ? "3 cards (Past • Present • Future)" : "3 cartes (Passé • Présent • Futur)" },
    { id: 5, label: lang==='en' ? "5 cards (Simple cross)" : "5 cartes (Croix simple)" },
  ]), [lang]);

  async function runPremium() {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch('/api/premium/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: cards.slice(0, count), question, lang, consent })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(lang==='en' ? "An error occurred. Please try again." : "Une erreur est survenue. Merci de réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(vote) {
    try {
      await fetch('/api/premium/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote, question, lang, cards: cards.slice(0, count) })
      });
      alert(lang==='en' ? "Thanks for your feedback!" : "Merci pour votre retour !");
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 to-violet-700 text-white">
      <Head>
        <title>{lang==='en' ? "Premium Reading — Nanou’s Tarot" : "Lecture Premium — Les tarots de Nanou"}</title>
        <meta name="description" content={lang==='en' ? "AI-powered premium tarot interpretation." : "Interprétation Premium assistée par IA."} />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="bg-white/10 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">{lang==='en' ? "Premium reading" : "Lecture Premium"}</h1>
            <div className="flex gap-2 text-sm">
              {options.map(o => (
                <button key={o.id}
                        onClick={() => { setCount(o.id); setCards(drawCards(o.id)); }}
                        className={`px-3 py-1 rounded-lg border border-white/20 ${count===o.id ? 'bg-white/20' : 'bg-white/5'}`}>
                  {o.label}
                </button>
              ))}
              <select value={lang} onChange={(e)=>setLang(e.target.value)}
                      className="text-violet-900 rounded px-2 py-1">
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {cards.slice(0, count).map((c, i) => (
              <TarotCard key={i} name={c.name} meaning={{up:c.up, rev:c.rev}} index={c.idx} />
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <textarea
              value={question}
              onChange={(e)=>setQuestion(e.target.value)}
              className="w-full rounded-lg p-3 text-violet-900"
              rows={3}
              placeholder={lang==='en' ? "Your precise question (topic + timeframe + context)" : "Votre question précise (thème + horizon + contexte)"}
            />
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} />
              {lang==='en'
                ? "I consent to anonymized storage of this conversation to improve the service."
                : "J’accepte l’enregistrement anonymisé de cette conversation pour améliorer le service."}
            </label>

            <div className="flex items-center gap-3">
              <button onClick={runPremium} disabled={loading}
                      className="bg-yellow-400 text-violet-900 px-4 py-2 rounded-lg font-semibold">
                {loading ? (lang==='en' ? "Analyzing…" : "Analyse…") : (lang==='en' ? "Generate interpretation (AI)" : "Générer l’interprétation (IA)")}
              </button>
              <a className="underline" href={PAYMENT_LINK} target="_blank" rel="noreferrer">
                {lang==='en' ? "Manage payment" : "Gérer le paiement"}
              </a>
            </div>

            {error && <div className="text-red-200">{error}</div>}
            {result && (
              <div className="mt-4 bg-black/20 p-4 rounded">
                <h3 className="text-xl font-semibold mb-2">{lang==='en' ? "AI interpretation" : "Interprétation IA"}</h3>
                <pre className="whitespace-pre-wrap">{result.pretty}</pre>

                <div className="mt-3 flex gap-2">
                  <button onClick={()=>sendFeedback('up')} className="bg-white/10 px-3 py-1 rounded">👍</button>
                  <button onClick={()=>sendFeedback('down')} className="bg-white/10 px-3 py-1 rounded">👎</button>
                </div>
                <p className="text-xs opacity-70 mt-2">
                  {lang==='en'
                    ? "Symbolic guidance only — not medical, financial or legal advice."
                    : "Guidance symbolique — ne remplace pas un avis médical, financier ou juridique."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
JS

# 2) API: /api/premium/interpret (appelle OpenAI)
cat > pages/api/premium/interpret.js <<'JS'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cards = [], question = '', lang = 'fr', consent = false } = req.body || {};
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  // Prépare un prompt structuré → réponse JSON
  const sys = lang === 'en'
    ? "You are a professional tarot reader. Produce a careful, ethical, **structured** analysis. NEVER give medical/financial/legal advice."
    : "Tu es un(e) tarologue professionnel(le). Donne une analyse **structurée** et prudente. NE FOURNIS PAS de conseils médicaux/financiers/juridiques.";

  const input = {
    language: lang,
    question,
    spreadSize: Math.max(1, Math.min(5, cards.length)),
    cards: cards.map(c => ({ name: c.name, upright: c.up, reversed: c.rev })),
    format: {
      type: "object",
      properties: {
        overview: { type: "string" },
        positions: { type: "array", items: { type: "object", properties: {
          label: { type: "string" },
          card: { type: "string" },
          keyThemes: { type: "array", items: { type: "string" } },
          opportunities: { type: "string" },
          cautions: { type: "string" }
        } } },
        synthesis: { type: "string" },
        actions_7days: { type: "array", items: { type: "string" } },
        tone: { type: "string" }
      },
      required: ["overview","positions","synthesis","actions_7days","tone"]
    }
  };

  // Choix de modèle: léger et économique, ajustable
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    // Appel API OpenAI (Responses API)
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: sys },
          { role: "user", content: `Cards: ${JSON.stringify(input.cards)}; Question: ${question || '(none)'}; Language: ${lang}; Spread: ${input.spreadSize}. Please answer in ${lang}.` }
        ],
        // Demande un JSON strict en sortie
        response_format: { type: "json_object" },
        temperature: 0.6
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "OpenAI error", detail: t });
    }

    const data = await r.json();
    // Selon Responses API, le JSON est dans output_text (ou first item)
    const raw = data?.output?.[0]?.content?.[0]?.text || data?.output_text || JSON.stringify(data);
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = { overview: raw, positions: [], synthesis: "", actions_7days: [], tone: "" }; }

    // Log ML (si consentement et si on n'est pas en env. serverless read-only)
    if (consent && process.env.LOG_TO_DISK !== 'false') {
      try {
        // ⚠️ Sur Vercel prod, FS est éphémère : préférer une DB (ex. Postgres). Ici on log local/dev.
        const fs = await import('fs');
        const line = JSON.stringify({
          ts: new Date().toISOString(),
          lang, question,
          cards: input.cards,
          model, parsed
        }) + "\n";
        fs.appendFileSync('data/premium_logs.jsonl', line, 'utf8');
      } catch {}
    }

    const pretty = [
      parsed.overview,
      "",
      ...(parsed.positions || []).map(p => `• ${p.label} — ${p.card}\n  Thèmes: ${(p.keyThemes||[]).join(', ')}\n  + ${p.opportunities}\n  ! ${p.cautions}`),
      "",
      `Synthèse: ${parsed.synthesis}`,
      `Actions (7 jours): ${(parsed.actions_7days||[]).map(a=>`- ${a}`).join('\n')}`,
      `Tonalité: ${parsed.tone}`
    ].join("\n");

    return res.status(200).json({ parsed, pretty });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
JS

# 3) API feedback: /api/premium/feedback → boucle ML (thumbs up/down)
cat > pages/api/premium/feedback.js <<'JS'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { vote, question, lang, cards } = req.body || {};
  try {
    const fs = await import('fs');
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      vote: vote === 'up' ? 1 : -1,
      lang, question, cards
    }) + "\n";
    // Même remarque: en prod, utiliser une DB (Postgres/Supabase). Ici: log local/dev.
    fs.appendFileSync('data/premium_feedback.jsonl', line, 'utf8');
  } catch {}
  return res.status(200).json({ ok: true });
}
JS

# 4) Mini lib (placeholder) : future intégration DB (Prisma/Supabase)
cat > lib/README-ml-loop.md <<'MD'
# ML loop (interne)

- Les interactions Premium sont loggées en JSONL:
  - `data/premium_logs.jsonl`: question/cartes/sortie IA
  - `data/premium_feedback.jsonl`: votes utilisateur (±1)

En production Vercel, utiliser une base de données (Postgres) et rediriger les écritures.
MD

echo "✅ Module Premium IA installé:"
echo "   - Page: pages/premium.js"
echo "   - API:  /api/premium/interpret (OpenAI) & /api/premium/feedback"
echo "   - Logs: data/premium_*.jsonl (dev/local)"
echo
echo "➡️ Ajoute tes variables d'env:"
echo "   OPENAI_API_KEY=sk-..."
echo "   (optionnel) OPENAI_MODEL=gpt-4.1-mini"
echo "   (optionnel) LOG_TO_DISK=false  # pour désactiver l'écriture locale"
