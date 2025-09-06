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
