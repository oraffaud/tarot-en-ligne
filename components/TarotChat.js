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
    const hasTower = names.some(n => n.includes("maison dieu") || n.includes("tour") || n.includes("tower"));
    const hasDeath = names.some(n => n.includes("arcane sans nom") || n.includes("mort") || n.includes("death"));
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
