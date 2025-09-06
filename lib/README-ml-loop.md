# ML loop (interne)

- Les interactions Premium sont loggées en JSONL:
  - `data/premium_logs.jsonl`: question/cartes/sortie IA
  - `data/premium_feedback.jsonl`: votes utilisateur (±1)

En production Vercel, utiliser une base de données (Postgres) et rediriger les écritures.
