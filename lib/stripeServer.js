import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export function getPaymentStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase server credentials')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
