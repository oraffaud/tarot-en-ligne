import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { requireOwner, requirePremiumSession, validateReadingInput, checkoutOrigin } from '../lib/serverSecurity.js';

const sessionId = 'cs_test_123456789012345678901234567890';
const paid = { id: sessionId, status: 'complete', payment_status: 'paid', amount_total: 1900, metadata: { product: 'premium_reading' }, line_items: { data: [{ price: { id: 'price_expected' }, quantity: 1 }] } };
function payment(session = paid) { return { priceId: 'price_expected', stripe: { checkout: { sessions: { retrieve: async () => session } } } }; }
const status = code => error => error.status === code;

test('rejects missing checkout before any service call', async () => assert.rejects(() => requirePremiumSession(''), status(402)));
test('accepts only a verified paid Premium checkout', async () => assert.equal(await requirePremiumSession(sessionId, payment()), sessionId));
test('rejects unpaid checkout', async () => assert.rejects(() => requirePremiumSession(sessionId, payment({ ...paid, payment_status: 'unpaid' })), status(402)));
test('rejects incomplete checkout', async () => assert.rejects(() => requirePremiumSession(sessionId, payment({ ...paid, status: 'open' })), status(402)));
test('rejects another product', async () => assert.rejects(() => requirePremiumSession(sessionId, payment({ ...paid, metadata: { product: 'other' } })), status(402)));
test('rejects another price', async () => assert.rejects(() => requirePremiumSession(sessionId, payment({ ...paid, line_items: { data: [{ price: { id: 'other' }, quantity: 1 }] } })), status(402)));
test('rejects zero amount', async () => assert.rejects(() => requirePremiumSession(sessionId, payment({ ...paid, amount_total: 0 })), status(402)));
test('rejects invalid provider response', async () => assert.rejects(() => requirePremiumSession(sessionId, { priceId: 'price_expected', stripe: { checkout: { sessions: { retrieve: async () => { throw Error('not found'); } } } } }), status(402)));
test('rejects anonymous translation before database access', async () => assert.rejects(() => requireOwner({ headers: {} }), status(401)));
function owner(role, verified = true) {
  return { db: { auth: { getUser: async () => verified ? { data: { user: { id: 'verified-user' } } } : { error: new Error('Invalid JWT') } }, from: () => ({ select: () => ({ eq: (_key, id) => { assert.equal(id, 'verified-user'); return { maybeSingle: async () => ({ data: { role } }) }; } }) }) } };
}
const req = { headers: { authorization: `Bearer ${'a'.repeat(25)}` } };
test('rejects unverified JWT', async () => assert.rejects(() => requireOwner(req, owner('owner', false)), status(401)));
test('rejects authenticated non-owner', async () => assert.rejects(() => requireOwner(req, owner('client')), status(403)));
test('accepts verified owner', async () => assert.equal(await requireOwner(req, owner('owner')), 'verified-user'));
test('allows valid bounded reading data', () => validateReadingInput({ cards: [{ name: 'Le Mat', up: 'Test', rev: 'Test' }], question: 'Test', lang: 'fr' }));
test('rejects oversized reading input', () => assert.throws(() => validateReadingInput({ cards: [{}], question: 'x'.repeat(2001), lang: 'fr' }), status(400)));
test('rejects unsupported card counts', () => assert.throws(() => validateReadingInput({ cards: [{ name: 'A' }, { name: 'B' }], question: 'Test', lang: 'fr' }), status(400)));
test('does not trust arbitrary checkout Origin or Host headers', () => assert.throws(() => checkoutOrigin({ headers: { origin: 'https://untrusted.example', host: 'untrusted.example' } }), status(403)));
test('keeps canonical checkout return URL without Origin', () => assert.equal(checkoutOrigin({ headers: { host: 'untrusted.example' } }), 'https://www.1001perspectives.com'));
test('client requests carry server authorization requirements', () => {
  assert.ok(fs.readFileSync('pages/premium.js', 'utf8').includes('paymentSessionId:'));
  assert.ok(fs.readFileSync('pages/admin/chat.js', 'utf8').includes("'Authorization':`Bearer"));
  assert.ok(fs.readFileSync('pages/api/premium/interpret.js', 'utf8').includes('await requirePremiumSession'));
  assert.ok(!fs.readFileSync('pages/api/stripe/verify-checkout.js', 'utf8').includes('customer_email'));
});
