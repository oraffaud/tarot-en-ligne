#!/usr/bin/env bash
set -e

mkdir -p .backup_tarot components pages

STAMP="$(date +%Y%m%d_%H%M%S)"

# 1) TarotChat.js — retire le “Conseil général” et ajoute i18n (FR/EN)
if [ -f components/TarotChat.js ]; then
  cp components/TarotChat.js ".backup_tarot/TarotChat.js.$STAMP"
fi
cat > components/TarotChat.js <<'JS'
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * TarotChat (bilingue)
 * - lang: 'fr' | 'en'
 * - retire le "Conseil général" par défaut
 */
export default function TarotChat({ cards = [], spreadSize = 3, lang = 'fr' }) {
  const t = {
    fr: {
      welcome: "Bienvenue 👋 Pose ta question. Voici une première lecture basée sur tes cartes :",
      guide: "Guide",
      you: "Vous",
      placeholder: "Pose ta question (ex: « Quel est le conseil pour mon projet ? »)",
      send: "Envoyer",
      disclaimer: "⚠️ Guidance symbolique — ne remplace pas un avis médical, financier ou juridique.",
      layout3: "Passé — Présent — Futur :",
      layout5: "Lecture en croix simple :",
      layout1: "Message :",
      labels3: ["Passé", "Présent", "Futur"],
      labels5: ["Contexte", "Défi", "Conseil", "Influences", "Issue probable"],
      labels1: ["Message clé"],
      upright: "Droite",
      reversed: "Inversée",
      none: "Aucune carte tirée pour l’instant.",
      tone: {
        sun: "fort potentiel de clarté, de réussite et de vitalité",
        star: "bonne protection et regain d’espoir",
        wheel: "période de tournant, cycles qui basculent",
        tower: "nécessité d’accepter une rupture/libération pour repartir sainement",
        death: "transformation inévitable, mue salutaire",
        devil: "attention aux attachements/peurs matérialistes",
        justice: "recherche d’équilibre et de décisions justes",
      },
      advice: {
        love: "Conseil amour → Reste honnête sur tes besoins, avance par petits pas cohérents. Si une rupture se profile, cherche l’alignement plutôt que la lutte.",
        work: "Conseil pro → Clarifie l’objectif, pose un plan simple (3 étapes) et garde une marge d’adaptation si la Roue indique un tournant.",
        money:"Conseil finances → Privilégie la sobriété sur 4–6 semaines, puis réévalue. Justice invite à des choix rationnels.",
        energy:"Conseil énergie → Écoute le rythme ; Soleil/Étoile favorisent la récupération, Diable/Tour invitent à lever une habitude qui épuise.",
      },
      toneTitle: "Tonalité du tirage → "
    },
    en: {
      welcome: "Welcome 👋 Ask your question. Here is a first reading based on your cards:",
      guide: "Guide",
      you: "You",
      placeholder: "Ask your question (e.g. “What advice for my project?”)",
      send: "Send",
      disclaimer: "⚠️ Symbolic guidance — not a substitute for medical, financial or legal advice.",
      layout3: "Past — Present — Future:",
      layout5: "Simple cross reading:",
      layout1: "Message:",
      labels3: ["Past", "Present", "Future"],
      labels5: ["Context", "Challenge", "Advice", "Influences", "Likely outcome"],
      labels1: ["Key message"],
      upright: "Upright",
      reversed: "Reversed",
      none: "No cards drawn yet.",
      tone: {
        sun: "strong potential for clarity, success and vitality",
        star: "good protection and renewed hope",
        wheel: "a turning point, cycles shifting",
        tower: "accept a rupture/release to rebuild cleanly",
        death: "inevitable transformation, a salutary shedding",
        devil: "beware of attachments/material fears",
        justice: "seek balance and fair decisions",
      },
      advice: {
        love: "Love tip → Be honest about your needs; take small consistent steps. If a breakup looms, aim for alignment rather than struggle.",
        work: "Work tip → Clarify the goal, draft a simple 3-step plan, keep flexibility if the Wheel signals a turn.",
        money:"Finance tip → Favour frugality for 4–6 weeks, then reassess. Justice invites rational choices.",
        energy:"Energy tip → Listen to your pace; Sun/Star help recovery, Devil/Tower suggest dropping a draining habit.",
      },
      toneTitle: "Reading tone → "
    }
  }[lang] || t['fr'];

  const labels = useMemo(() => {
    if (spreadSize === 5) return t.labels5;
    if (spreadSize === 1) return t.labels1;
    return t.labels3;
  }, [spreadSize, t]);

  const baseReading = useMemo(() => {
    if (!cards || cards.length === 0) return t.none;
    const parts = cards.slice(0, spreadSize).map((c, i) => {
      const sense = (c.reversed ? t.reversed : t.upright);
      const meaning = c.reversed ? (c.rev || "") : (c.up || "");
      const label = labels[i] || `Card ${i + 1}`;
      return `• ${label} — ${c.name} (${sense})${meaning ? ` : ${meaning}.` : "."}`;
    });
    const toneTitle = spreadSize === 5 ? t.layout5 : (spreadSize === 3 ? t.layout3 : t.layout1);
    return `${toneTitle}\n${parts.join("\n")}`;
  }, [cards, spreadSize, labels, t]);

  function interpret(question) {
    const q = (question || "").trim().toLowerCase();
    const core = baseReading;

    // Tonalité en fonction des cartes tirées
    const names = (cards || []).map(c => (c?.name || "").toLowerCase());
    const hasSun = names.some(n => n.includes("soleil") || n.includes("sun"));
    const hasTower = names.some(n => n.includes("tour") || n.includes("tower"));
    const hasDeath = names.some(n => n.includes("mort") || n.includes("death"));
    const hasStar = names.some(n => n.includes("étoile") || n.includes("star"));
    const hasDevil = names.some(n => n.includes("diable") || n.includes("devil"));
    const hasJustice = names.some(n => n.includes("justice"));
    const hasWheel = names.some(n => n.includes("roue") || n.includes("wheel"));

    const vibes = [];
    if (hasSun) vibes.push(t.tone.sun);
    if (hasStar) vibes.push(t.tone.star);
    if (hasWheel) vibes.push(t.tone.wheel);
    if (hasTower) vibes.push(t.tone.tower);
    if (hasDeath) vibes.push(t.tone.death);
    if (hasDevil) vibes.push(t.tone.devil);
    if (hasJustice) vibes.push(t.tone.justice);

    let advice = "";
    // Domaines spécifiques uniquement — pas de "Conseil général"
    if (q.includes("amour") || q.includes("relation") || q.includes("sentiment") || q.includes("love") || q.includes("relationship")) {
      advice += "\n\n" + t.advice.love;
    } else if (q.includes("travail") || q.includes("carrière") || q.includes("projet") || q.includes("work") || q.includes("career") || q.includes("project")) {
      advice += "\n\n" + t.advice.work;
    } else if (q.includes("argent") || q.includes("finance") || q.includes("money")) {
      advice += "\n\n" + t.advice.money;
    } else if (q.includes("santé") || q.includes("energie") || q.includes("énergie") || q.includes("health") || q.includes("energy")) {
      advice += "\n\n" + t.advice.energy;
    }

    if (vibes.length) {
      advice = `\n\n${t.toneTitle}${vibes.join(" ; ")}.` + advice;
    }
    return `${core}${advice}`;
  }

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    setMessages([
      { role: "assistant", content: t.welcome },
      { role: "assistant", content: baseReading },
    ]);
  }, [baseReading, lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: interpret(text) }]);
    setInput("");
  }
  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="mt-8 bg-white/10 rounded-xl p-4">
      <h3 className="text-xl font-semibold mb-2">{lang === 'fr' ? "Interprétation par chat" : "Reading via chat"}</h3>

      <div className="h-64 overflow-y-auto space-y-3 p-3 bg-black/10 rounded">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "assistant" ? "text-violet-100" : "text-white"}>
            <div className="text-xs opacity-80 mb-1">{m.role === "assistant" ? t.guide : t.you}</div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 rounded-lg p-2 text-violet-900"
          rows={2}
          placeholder={t.placeholder}
        />
        <button onClick={send} className="bg-yellow-400 text-violet-900 px-4 py-2 rounded-lg font-semibold self-start">
          {t.send}
        </button>
      </div>
      <p className="text-xs opacity-70 mt-2">{t.disclaimer}</p>
    </div>
  );
}
JS
echo "✅ components/TarotChat.js mis à jour"

# 2) Header.js — ajoute un sélecteur FR/EN (via paramètres d’URL)
if [ -f components/Header.js ]; then
  cp components/Header.js ".backup_tarot/Header.js.$STAMP"
fi
cat > components/Header.js <<'JS'
import { useRouter } from 'next/router'

export default function Header() {
  const router = useRouter();
  const lang = (router.query.lang === 'en') ? 'en' : 'fr';

  const switchLang = (lng) => {
    const q = { ...router.query, lang: lng };
    router.push({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };

  return (
    <header className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <img src="/logo-nanou.svg" alt={lang==='fr' ? "Les tarots de Nanou" : "Nanou's Tarot"} className="w-10 h-10" />
        <span className="font-semibold text-lg">
          {lang === 'fr' ? "Les tarots de Nanou" : "Nanou's Tarot"}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => switchLang('fr')}
          className={`px-2 py-1 rounded ${lang==='fr' ? 'bg-white/20' : 'bg-white/10'}`}
        >FR</button>
        <button
          onClick={() => switchLang('en')}
          className={`px-2 py-1 rounded ${lang==='en' ? 'bg-white/20' : 'bg-white/10'}`}
        >EN</button>
      </div>
    </header>
  );
}
JS
echo "✅ components/Header.js mis à jour (sélecteur FR/EN)"

# 3) pages/index.js — lit ?lang= et localise l’UI + passe lang aux composants
cp pages/index.js ".backup_tarot/index.js.$STAMP"
cat > pages/index.js <<'JS'
import Head from 'next/head'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'
import TarotChat from '../components/TarotChat'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

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

export default function Home() {
  const router = useRouter();
  const lang = router.query.lang === 'en' ? 'en' : 'fr';

  const ui = lang === 'en' ? {
    title: "Nanou’s Tarot — Online",
    heroH1: "Draw the cards, light your path",
    heroP: "Instant free draw. For a detailed, personalized reading, click Premium Reading.",
    newDraw: "New draw",
    premium: "Premium Reading — €19",
    result: (n) => `Current draw (${n} card${n>1?'s':''})`,
    opt1: "1 card",
    opt3: "3 cards (Past • Present • Future)",
    opt5: "5 cards (Simple cross)"
  } : {
    title: "Les tarots de Nanou — Tarot en ligne",
    heroH1: "Tirez les cartes, éclairez votre chemin",
    heroP: "Tirage instantané gratuit. Pour une lecture détaillée et personnalisée, cliquez sur Lecture Premium.",
    newDraw: "Nouveau tirage",
    premium: "Lecture Premium — 19€",
    result: (n) => `Tirage actuel (${n} carte${n>1?'s':''})`,
    opt1: "1 carte",
    opt3: "3 cartes (Passé • Présent • Futur)",
    opt5: "5 cartes (Croix simple)"
  };

  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(3);
  const [cards, setCards] = useState([]);

  useEffect(() => { setMounted(true); setCards(drawCards(3)); }, []);

  const onNewDraw = () => setCards(drawCards(count));
  const options = useMemo(() => ([
    { id: 1, label: ui.opt1 },
    { id: 3, label: ui.opt3 },
    { id: 5, label: ui.opt5 },
  ]), [ui]);

  const previewCards = mounted && cards.length ? cards.slice(0, Math.min(3, cards.length)) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 to-violet-700 text-white">
      <Head>
        <title>{ui.title}</title>
        <meta name="description" content={lang==='en' ? "Free draws and premium tarot readings online." : "Tirages gratuits et lectures premium de tarot en ligne."} />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <section className="grid md:grid-cols-2 gap-8 items-center py-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">{ui.heroH1}</h1>
            <p className="mb-6 text-violet-100">{ui.heroP}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onNewDraw} className="bg-white/10 px-4 py-2 rounded-lg">{ui.newDraw}</button>
              <a href={PAYMENT_LINK} className="bg-yellow-400 text-violet-900 px-4 py-2 rounded-lg font-semibold">{ui.premium}</a>
            </div>
            <div className="mt-4 flex gap-2 text-sm">
              {options.map(o => (
                <button
                  key={o.id}
                  onClick={() => setCount(o.id)}
                  className={`px-3 py-1 rounded-lg border border-white/20 ${count===o.id ? 'bg-white/20' : 'bg-white/5'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="space-x-[-40px] flex items-end">
              {previewCards.length > 0 ? (
                previewCards.map((c, i) => (
                  <TarotCard key={i} name={c.name} meaning={{up:c.up, rev:c.rev}} index={c.idx} />
                ))
              ) : (
                <>
                  <div className="w-44 h-60 bg-white/10 rounded-xl" />
                  <div className="w-44 h-60 bg-white/10 rounded-xl" />
                  <div className="w-44 h-60 bg-white/10 rounded-xl" />
                </>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">{ui.result(count)}</h2>
          <div className={`grid gap-4 ${count===1?'grid-cols-1':'grid-cols-1 md:grid-cols-3'}`}>
            {mounted && cards.length > 0 ? (
              cards.slice(0, count).map((c, i) => (
                <TarotCard key={i} name={c.name} meaning={{up:c.up, rev:c.rev}} index={c.idx} />
              ))
            ) : (
              Array.from({length: count}).map((_,i)=>(
                <div key={i} className="w-44 h-60 bg-white/10 rounded-xl" />
              ))
            )}
          </div>
        </section>

        <TarotChat cards={cards} spreadSize={count} lang={lang} />
      </main>
    </div>
  )
}
JS
echo "✅ pages/index.js localisé (FR/EN) et chat mis à jour"

echo "🎉 Terminé. Lance 'npm run dev' puis ajoute ?lang=en à l’URL pour l’anglais."
echo "   Exemples: http://localhost:3000/?lang=fr  |  http://localhost:3000/?lang=en"
