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
