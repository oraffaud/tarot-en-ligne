import { useEffect, useMemo, useRef, useState } from "react";

/**
 * TarotChat
 * - Affiche un chat simple (user ↔ assistant)
 * - Utilise le tirage courant (props.cards) pour produire une interprétation
 * - Zéro API externe
 */
export default function TarotChat({ cards = [], spreadSize = 3 }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Libellés selon le nombre de cartes tirées
  const labels = useMemo(() => {
    if (spreadSize === 5) {
      return ["Contexte", "Défi", "Conseil", "Influences", "Issue probable"];
    } else if (spreadSize === 1) {
      return ["Message clé"];
    } else {
      return ["Passé", "Présent", "Futur"];
    }
  }, [spreadSize]);

  // Génère une interprétation “de base” du tirage courant
  const baseReading = useMemo(() => {
    if (!cards || cards.length === 0) return "Aucune carte tirée pour l’instant.";
    const parts = cards.slice(0, spreadSize).map((c, i) => {
      const sense = (c.reversed ? "Inversée" : "Droite");
      const meaning = c.reversed ? (c.rev || "aspects bloqués") : (c.up || "potentiel");
      const label = labels[i] || `Carte ${i + 1}`;
      return `• ${label} — ${c.name} (${sense}) : ${meaning}.`;
    });
    const tone = spreadSize === 5
      ? "Lecture en croix simple :"
      : spreadSize === 3
        ? "Passé — Présent — Futur :"
        : "Message :";
    return `${tone}\n${parts.join("\n")}`;
  }, [cards, spreadSize, labels]);

  // Heuristique de réponse : combine question + tirage
  function interpret(question) {
    const q = (question || "").trim().toLowerCase();
    const core = baseReading;

    // Petites règles de tonalité en fonction des cartes présentes
    const names = (cards || []).map(c => (c?.name || "").toLowerCase());
    const hasSun = names.some(n => n.includes("soleil"));
    const hasTower = names.some(n => n.includes("tour"));
    const hasDeath = names.some(n => n.includes("mort"));
    const hasStar = names.some(n => n.includes("étoile"));
    const hasDevil = names.some(n => n.includes("diable"));
    const hasJustice = names.some(n => n.includes("justice"));
    const hasWheel = names.some(n => n.includes("roue"));

    const vibes = [];
    if (hasSun) vibes.push("fort potentiel de clarté, de réussite et de vitalité");
    if (hasStar) vibes.push("bonne protection et regain d’espoir");
    if (hasWheel) vibes.push("période de tournant, cycles qui basculent");
    if (hasTower) vibes.push("nécessité d’accepter une rupture/libération pour repartir sainement");
    if (hasDeath) vibes.push("transformation inévitable, mue salutaire");
    if (hasDevil) vibes.push("attention aux attachements/peurs matérialistes");
    if (hasJustice) vibes.push("recherche d’équilibre et de décisions justes");

    let advice = "";
    if (vibes.length) {
      advice = `\n\nTonalité du tirage → ${vibes.join(" ; ")}.`;
    }

    // Mini routage par intention
    if (q.includes("amour") || q.includes("relation") || q.includes("sentiment")) {
      advice += "\nConseil amour → Reste honnête sur tes besoins, avance par petits pas cohérents. Si une rupture se profile, cherche l’alignement plutôt que la lutte.";
    } else if (q.includes("travail") || q.includes("carrière") || q.includes("projet")) {
      advice += "\nConseil pro → Clarifie l’objectif, pose un plan simple (3 étapes) et garde une marge d’adaptation si la Roue indique un tournant.";
    } else if (q.includes("argent") || q.includes("finance")) {
      advice += "\nConseil finances → Privilégie la sobriété sur 4–6 semaines, puis réévalue. Justice invite à des choix rationnels.";
    } else if (q.includes("santé") || q.includes("energie") || q.includes("énergie")) {
      advice += "\nConseil énergie → Écoute le rythme ; Soleil/Étoile favorisent la récupération, Diable/Tour invitent à lever une habitude qui épuise.";
    } else if (q.length > 0) {
      advice += "\nConseil général → Reformule ta question de manière très précise (quoi + quand + pourquoi) pour une lecture plus tranchée.";
    }

    return `${core}${advice}`;
  }

  // Message de bienvenue basé sur le tirage en cours
  useEffect(() => {
    setMessages([
      { role: "assistant", content: "Bienvenue 👋 Pose ta question. Voici une première lecture basée sur tes cartes :" },
      { role: "assistant", content: baseReading },
    ]);
  }, [baseReading]);

  // Scroll auto
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg = { role: "user", content: text };
    const botMsg = { role: "assistant", content: interpret(text) };
    setMessages(prev => [...prev, userMsg, botMsg]);
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
      <h3 className="text-xl font-semibold mb-2">Interprétation par chat</h3>

      <div className="h-64 overflow-y-auto space-y-3 p-3 bg-black/10 rounded">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "assistant" ? "text-violet-100" : "text-white"}>
            <div className="text-xs opacity-80 mb-1">{m.role === "assistant" ? "Guide" : "Vous"}</div>
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
          placeholder="Pose ta question (ex: « Quel est le conseil pour mon projet ? »)"
        />
        <button onClick={send} className="bg-yellow-400 text-violet-900 px-4 py-2 rounded-lg font-semibold self-start">
          Envoyer
        </button>
      </div>
      <p className="text-xs opacity-70 mt-2">⚠️ Guidance symbolique — ne remplace pas un avis médical, financier ou juridique.</p>
    </div>
  );
}
