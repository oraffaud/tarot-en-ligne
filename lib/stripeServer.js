import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export function getPaymentStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    console.error('Supabase env status', {
      nextPublicUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      serverUrl: Boolean(process.env.SUPABASE_URL),
      serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      secretKey: Boolean(process.env.SUPABASE_SECRET_KEY)
    })
    throw new Error('Missing Supabase server credentials')
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
