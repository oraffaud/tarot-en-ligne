import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Set STRIPE_SECRET_KEY before running this script')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const product = await stripe.products.create({
  name: 'Lecture Premium personnalisée – Les Tarots de Nanou',
  description: 'Lecture complète et personnalisée de votre tirage du Tarot de Marseille. Paiement unique, sans abonnement.',
  default_price_data: {
    currency: 'eur',
    unit_amount: 1900
  },
  metadata: {
    product: 'premium_reading'
  }
})

console.log('STRIPE_PREMIUM_PRODUCT_ID=' + product.id)
console.log('STRIPE_PREMIUM_PRICE_ID=' + product.default_price)
