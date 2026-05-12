import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const billedEventId = pi.metadata?.billed_event_id
    if (billedEventId) {
      await supabase.from('billed_events').update({
        stripe_payment_id: pi.id,
        status: 'paid',
      }).eq('id', billedEventId)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const billedEventId = pi.metadata?.billed_event_id
    if (billedEventId) {
      await supabase.from('billed_events').update({
        status: 'pending',
      }).eq('id', billedEventId)
    }
  }

  if (event.type === 'customer.updated') {
    const customer = event.data.object as Stripe.Customer
    const userId = customer.metadata?.user_id
    if (userId) {
      await supabase.from('stripe_customers').update({
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', customer.id)
    }
  }

  return NextResponse.json({ received: true })
}
