import { getPaymentStore, getStripe } from './stripeServer.js'

export class AccessError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

export async function requireOwner(req, dependencies = {}) {
  const authorization = req.headers?.authorization || ''
  const match = /^Bearer ([A-Za-z0-9._~-]{20,8192})$/.exec(authorization)
  if (!match) throw new AccessError('Authentication required', 401)
  const db = dependencies.db || getPaymentStore()
  const { data, error } = await db.auth.getUser(match[1])
  if (error || !data?.user?.id) throw new AccessError('Invalid session', 401)
  const profile = await db.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
  if (profile.error || profile.data?.role !== 'owner') throw new AccessError('Owner access required', 403)
  return data.user.id
}

export async function requirePremiumSession(sessionId, dependencies = {}) {
  if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{16,240}$/.test(sessionId)) {
    throw new AccessError('A paid checkout session is required', 402)
  }
  const priceId = dependencies.priceId || process.env.STRIPE_PREMIUM_PRICE_ID
  if (!priceId) throw new AccessError('Payment verification unavailable', 503)
  const stripe = dependencies.stripe || getStripe()
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] })
  } catch {
    throw new AccessError('Unable to verify paid checkout', 402)
  }
  const items = session.line_items?.data || []
  if (session.status !== 'complete' || session.payment_status !== 'paid' ||
      session.metadata?.product !== 'premium_reading' || items.length !== 1 ||
      items[0]?.price?.id !== priceId || items[0]?.quantity !== 1 || !(session.amount_total > 0)) {
    throw new AccessError('Paid Premium checkout required', 402)
  }
  return session.id
}

export function validateReadingInput(body) {
  if (!body || !Array.isArray(body.cards) || ![1, 3, 5].includes(body.cards.length) ||
      typeof body.question !== 'string' || body.question.length > 2000 ||
      !['fr', 'en'].includes(body.lang)) throw new AccessError('Invalid reading input', 400)
  for (const card of body.cards) {
    if (!card || typeof card.name !== 'string' || card.name.length > 160 ||
        ['up', 'rev'].some(key => card[key] !== undefined && (typeof card[key] !== 'string' || card[key].length > 2000))) {
      throw new AccessError('Invalid card input', 400)
    }
  }
}

export function checkoutOrigin(req) {
  const allowed = new Set(['https://www.1001perspectives.com', 'https://1001perspectives.com'])
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (host && /^[a-z0-9.-]+\.vercel\.app$/i.test(host)) allowed.add(`https://${host}`)
  }
  if (process.env.NODE_ENV !== 'production') allowed.add('http://localhost:3000')
  const origin = req.headers?.origin
  if (origin && !allowed.has(origin)) throw new AccessError('Origin not allowed', 403)
  return origin || 'https://www.1001perspectives.com'
}
