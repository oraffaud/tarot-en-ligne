import fs from 'node:fs';

function replaceOnce(source, oldText, newText) {
  if (!source.includes(oldText) || source.indexOf(oldText) !== source.lastIndexOf(oldText)) throw new Error('Expected exactly one source anchor');
  return source.replace(oldText, newText);
}
function patch(file, marker, transform) {
  const before = fs.readFileSync(file, 'utf8');
  if (before.includes(marker)) return;
  fs.writeFileSync(file, transform(before));
}

patch('pages/api/premium/interpret.js', 'requirePremiumSession', source => {
  source = "import { requirePremiumSession, validateReadingInput, checkoutOrigin } from '../../../lib/serverSecurity.js'\nexport const config = { api: { bodyParser: { sizeLimit: '32kb' } } }\n\n" + source;
  source = replaceOnce(source,
    "  const { cards = [], question = '', lang = 'fr' } = req.body || {}",
    "  res.setHeader('Cache-Control', 'no-store')\n  try {\n    checkoutOrigin(req)\n    validateReadingInput(req.body)\n    await requirePremiumSession(req.body?.paymentSessionId)\n  } catch (error) {\n    return res.status(error.status || 503).json({ error: error.status ? error.message : 'Access verification unavailable' })\n  }\n\n  const { cards = [], question = '', lang = 'fr' } = req.body || {}");
  source = replaceOnce(source, "        temperature: 0.85", "        temperature: 0.85,\n        max_output_tokens: 3000");
  source = replaceOnce(source, "      method: 'POST',", "      method: 'POST',\n      signal: AbortSignal.timeout(45000),");
  source = source.replace("reason: String(e).slice(0, 400)", "reason: 'provider_unavailable'");
  source = source.replace("detail: String(e).slice(0, 500)", "detail: 'The reading service is temporarily unavailable'");
  return source;
});

patch('pages/premium.js', 'paymentSessionId:', source => replaceOnce(source,
  "        body: JSON.stringify({\n          cards: cards.slice(0, count),",
  "        body: JSON.stringify({\n          paymentSessionId: typeof router.query.session_id === 'string' ? router.query.session_id : window.localStorage.getItem('nanou_paid_session_id'),\n          cards: cards.slice(0, count),"));

patch('pages/api/admin/translate-chat.js', 'requireOwner', source => {
  source = "import { requireOwner } from '../../../lib/serverSecurity.js'\nexport const config = { api: { bodyParser: { sizeLimit: '16kb' } } }\n" + source;
  return replaceOnce(source, "  const text=String(req.body?.text||'').trim().slice(0,4000)",
    "  res.setHeader('Cache-Control','no-store')\n  try { await requireOwner(req) } catch(error) { return res.status(error.status||503).json({error:error.status?error.message:'Access verification unavailable'}) }\n  const text=String(req.body?.text||'').trim().slice(0,4000)");
});

patch('pages/admin/chat.js', "'Authorization':`Bearer", source => replaceOnce(source,
  "headers:{'Content-Type':'application/json'},body:JSON.stringify({text:m.body})",
  "headers:{'Content-Type':'application/json','Authorization':`Bearer ${session?.access_token || ''}`},body:JSON.stringify({text:m.body})"));

patch('pages/api/stripe/create-checkout.js', 'checkoutOrigin', source => {
  source = "import { checkoutOrigin } from '../../../lib/serverSecurity.js'\n" + source;
  source = replaceOnce(source, "    const origin = req.headers.origin || `https://${req.headers.host}`", "    const origin = checkoutOrigin(req)");
  source = replaceOnce(source, "  try {\n    const stripe = getStripe()", "  res.setHeader('Cache-Control', 'no-store')\n  try {\n    checkoutOrigin(req)\n    const stripe = getStripe()");
  return source.replace("return res.status(500).json({ error: 'Unable to create checkout session' })", "return res.status(e.status || 500).json({ error: e.status ? e.message : 'Unable to create checkout session' })");
});

patch('pages/api/stripe/verify-checkout.js', "res.setHeader('Cache-Control'", source => {
  source = replaceOnce(source, "  const sessionId = String(req.query.session_id || '')", "  res.setHeader('Cache-Control', 'no-store')\n  const sessionId = String(req.query.session_id || '')");
  source = source.replace("if (!sessionId.startsWith('cs_'))", "if (!/^cs_[A-Za-z0-9_]{16,240}$/.test(sessionId))");
  source = source.replace("payment_status, customer_email, amount_total, currency", "payment_status, amount_total, currency");
  source = source.replace("      customer_email: data?.customer_email || null,\n", "");
  return source;
});
console.log('Applied bounded, idempotent security patches to six reviewed files.');
