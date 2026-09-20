import Head from 'next/head'
import Link from 'next/link'
import Header from './Header'

const ORIGIN = 'https://www.1001perspectives.com'
export default function PremiumOffer({ lang = 'fr' }) {
  const fr = lang === 'fr'
  const pathname = fr ? '/fr/lecture-premium' : '/en/premium-reading'
  const title = fr ? 'Lecture tarot de Marseille détaillée · 19 € | Les Tarots de Nanou' : 'Detailed Marseille tarot reading · €19 | Nanou’s Tarot'
  const description = fr ? 'Découvrez le contenu de la lecture Premium à 19 € : interprétation écrite automatisée, exemple et limites. Commencez par un tirage gratuit sans compte.' : 'Explore the €19 Premium reading: automated written interpretation, an example and clear limits. Start with a free reading without an account.'
  const items = fr ? [
    ['Votre question et vos cartes', 'Le texte est élaboré à partir de la question et des cartes transmises au service, avec une lecture adaptée au tirage.'],
    ['Une lecture structurée', 'Un éclairage pour chaque carte, les liens entre elles et une synthèse symbolique pour nourrir votre réflexion.'],
    ['Un format écrit', 'La lecture s’affiche dans le navigateur après validation du paiement. Ce n’est ni un rendez-vous ni une consultation rédigée personnellement par Nanou.'],
  ] : [
    ['Your question and cards', 'The text is developed from the question and cards sent to the service, with an interpretation suited to the spread.'],
    ['A structured reading', 'An interpretation of each card, connections between the cards and a symbolic synthesis to support reflection.'],
    ['A written format', 'The reading appears in your browser after payment verification. It is not an appointment or a consultation personally written by Nanou.'],
  ]
  const faqs = fr ? [
    ['Que puis-je découvrir gratuitement ?', 'Le tirage découverte propose un premier éclairage symbolique sans création de compte. La lecture détaillée Premium est une étape payante distincte.'],
    ['La lecture à 19 € est-elle automatisée ?', 'Oui. Une IA produit l’interprétation écrite à partir des éléments du tirage. Ce texte ne doit pas être confondu avec un échange personnel avec Nanou.'],
    ['Le chat et la lecture sont-ils le même service ?', 'Non. Le texte automatisé et l’espace de conversation sont distincts. L’existence du chat ne signifie pas que la lecture a été rédigée ou relue par Nanou, ni qu’une réponse humaine est disponible immédiatement.'],
    ['Les cartes prédisent-elles un résultat certain ?', 'Non. La lecture est symbolique et destinée à la réflexion. Elle ne garantit aucun événement et ne remplace pas un avis médical, juridique ou financier.'],
    ['Que se passe-t-il après le paiement ?', 'Stripe renvoie vers l’espace Premium. Le site vérifie la session de paiement avant de permettre la génération de la lecture. Conservez la confirmation et revenez depuis le même navigateur pour retrouver le contexte local.'],
  ] : [
    ['What can I explore for free?', 'The discovery reading offers an initial symbolic interpretation without an account. The detailed Premium reading is a separate paid step.'],
    ['Is the €19 reading automated?', 'Yes. AI generates the written interpretation from the spread. This text is distinct from a personal conversation with Nanou.'],
    ['Are chat and the written reading the same service?', 'No. The automated text and conversation area are separate. Access to chat does not mean that Nanou wrote or reviewed the reading, or that a human reply is immediately available.'],
    ['Do the cards predict a certain outcome?', 'No. The interpretation is symbolic and intended for reflection. It guarantees no event and does not replace medical, legal or financial advice.'],
    ['What happens after payment?', 'Stripe returns you to the Premium area. The website verifies the payment session before allowing the reading to be generated. Keep the confirmation and use the same browser to retain the locally saved context.'],
  ]
  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white" lang={lang}>
    <Head><title>{title}</title><meta name="description" content={description}/><meta name="robots" content="index,follow"/><link rel="canonical" href={ORIGIN + pathname}/><link rel="alternate" hrefLang="fr" href={ORIGIN + '/fr/lecture-premium'}/><link rel="alternate" hrefLang="en" href={ORIGIN + '/en/premium-reading'}/><link rel="alternate" hrefLang="x-default" href={ORIGIN + '/fr/lecture-premium'}/><meta property="og:title" content={title}/><meta property="og:description" content={description}/><meta property="og:url" content={ORIGIN + pathname}/><meta property="og:site_name" content="Les Tarots de Nanou · 1001 Perspectives"/></Head>
    <Header locale={lang}/>
    <main className="max-w-5xl mx-auto px-5 pb-16">
      <section className="max-w-3xl mx-auto text-center py-12 md:py-20">
        <p className="text-sm uppercase tracking-widest text-amber-100">{fr ? 'Les Tarots de Nanou, par 1001 Perspectives' : 'Nanou’s Tarot, by 1001 Perspectives'}</p>
        <h1 className="mt-5 text-4xl md:text-5xl font-serif leading-tight">{fr ? 'Un tirage pour éclairer votre question, sans vous dicter votre avenir.' : 'A reading to illuminate your question, not dictate your future.'}</h1>
        <p className="mt-6 text-lg leading-8 text-violet-100">{fr ? 'Découvrez d’abord le tarot de Marseille gratuitement. La lecture Premium prolonge le tirage par une interprétation écrite automatisée, proposée à 19 €.' : 'Explore Marseille tarot for free first. The Premium reading extends the spread with an automated written interpretation, offered at €19.'}</p>
        <div className="mt-7 rounded-2xl border border-amber-100/30 p-5"><strong className="text-2xl">{fr ? '19 € · Lecture Premium' : '€19 · Premium reading'}</strong><p className="mt-2 text-violet-100">{fr ? 'Texte généré à l’aide d’une IA. Pas de consultation humaine présentée comme automatisée, ni l’inverse.' : 'AI-generated text, clearly distinguished from a human consultation.'}</p></div>
        <div className="mt-7 flex flex-wrap justify-center gap-4"><Link className="rounded-full bg-amber-200 px-7 py-3 font-semibold text-violet-950" href={fr ? '/' : '/?lang=en'} data-conversion="free_reading_start">{fr ? 'Commencer par le tirage gratuit' : 'Start with the free reading'}</Link><Link className="rounded-full border border-white/40 px-7 py-3" href={fr ? '/premium' : '/premium?lang=en'} data-conversion="premium_offer_continue">{fr ? 'Continuer vers Premium · 19 €' : 'Continue to Premium · €19'}</Link></div>
        <p className="mt-4 text-sm text-violet-200">{fr ? 'Vous choisissez de poursuivre ou non. Aucun résultat certain n’est promis.' : 'Continuing is your choice. No certain outcome is promised.'}</p>
      </section>
      <section aria-labelledby="included-title"><h2 id="included-title" className="text-3xl font-serif">{fr ? 'Ce que contient la lecture détaillée' : 'What the detailed reading includes'}</h2><div className="grid gap-5 md:grid-cols-3 mt-7">{items.map(([heading, text]) => <article key={heading} className="rounded-2xl border border-white/15 bg-white/5 p-6"><h3 className="text-xl font-serif">{heading}</h3><p className="mt-4 leading-7 text-violet-100">{text}</p></article>)}</div></section>
      <section className="mt-12 rounded-2xl border border-white/15 bg-white/5 p-7"><p className="text-sm uppercase tracking-widest text-amber-100">{fr ? 'Extrait fictif · Exemple de style' : 'Fictional excerpt · Style example'}</p><h2 className="mt-3 text-2xl font-serif">{fr ? 'Une invitation à prendre du recul' : 'An invitation to step back'}</h2><blockquote className="mt-4 leading-8 text-lg text-violet-100">{fr ? '« Le Mat peut évoquer une envie d’explorer, tandis que La Justice invite à clarifier vos critères. Ensemble, ces cartes peuvent vous aider à distinguer un nouvel élan d’une décision précipitée. Quel élément concret vous manque encore pour avancer ? »' : '“The Fool may suggest a wish to explore, while Justice invites you to clarify your criteria. Together, these cards can help you distinguish a fresh impulse from a rushed decision. What concrete information would help you move forward?”'}</blockquote><p className="mt-4 text-sm text-violet-200">{fr ? 'Exemple éditorial, non issu d’un client. Le contenu réel dépend du tirage ; cet extrait ne constitue pas une prédiction.' : 'Editorial example, not a customer reading. Actual content depends on the spread; this excerpt is not a prediction.'}</p></section>
      <section className="mt-12"><h2 className="text-3xl font-serif">{fr ? 'Avant de choisir Premium' : 'Before choosing Premium'}</h2><div className="mt-6 space-y-3">{faqs.map(([q, a]) => <details key={q} className="rounded-xl border border-white/20 p-5"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-4 leading-7 text-violet-100">{a}</p></details>)}</div></section>
      <section className="mt-12"><h2 className="text-3xl font-serif">{fr ? 'Choisir un thème pour votre réflexion' : 'Choose a theme for reflection'}</h2><nav className="mt-5 flex flex-wrap gap-5" aria-label={fr ? 'Découvrir le tarot' : 'Explore tarot'}><Link className="underline underline-offset-4" href={fr ? '/fr/tirage-amour' : '/en/love-tarot'}>{fr ? 'Tirage amour' : 'Love reading'}</Link><Link className="underline underline-offset-4" href={fr ? '/fr/tirage-travail' : '/en/career-tarot'}>{fr ? 'Tirage travail' : 'Career reading'}</Link><Link className="underline underline-offset-4" href={fr ? '/fr/consultation-tarologue' : '/en/tarot-reader'}>{fr ? 'Échanger avec Nanou : présentation' : 'Conversation with Nanou: overview'}</Link></nav></section>
      <footer className="mt-12 border-t border-white/20 pt-6 text-sm text-violet-200"><p>{fr ? 'Ne saisissez pas de données sensibles dans votre question. La lecture ne remplace pas une aide professionnelle et vous restez libre de vos décisions.' : 'Do not include sensitive data in your question. A reading does not replace professional help; your decisions remain yours.'}</p><div className="flex flex-wrap gap-5 mt-4"><Link href="/conditions" className="underline">{fr ? 'Conditions du service' : 'Service terms'}</Link><Link href={fr ? '/premium' : '/premium?lang=en'} className="underline">{fr ? 'Accéder à ma lecture déjà réglée' : 'Access my paid reading'}</Link></div></footer>
    </main>
  </div>
}
