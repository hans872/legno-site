import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

type Classification = 'qualified' | 'question' | 'not_now' | 'auto_reply'

async function classifyReply(body: string): Promise<Classification> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    system: `You classify email replies to cold outreach from blueprint estimators. Reply with exactly one word:
- "qualified" — contractor is interested, wants to proceed, or asks for a sample/quote
- "question" — asking for more info but seems interested
- "not_now" — not interested, has someone, or declines politely
- "auto_reply" — out of office, automated message, or bounced`,
    messages: [{ role: 'user', content: `Classify this reply:\n\n${body.slice(0, 1000)}` }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim().toLowerCase() : 'not_now'
  if (['qualified', 'question', 'not_now', 'auto_reply'].includes(text)) {
    return text as Classification
  }
  return 'not_now'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { replyId } = await request.json()

  const { data: reply, error } = await supabase
    .from('replies')
    .select('*')
    .eq('id', replyId)
    .eq('user_id', user.id)
    .single()

  if (error || !reply) {
    return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
  }

  const classification = await classifyReply(reply.body ?? '')

  await supabase.from('replies').update({
    classification,
    classified_at: new Date().toISOString(),
  }).eq('id', replyId)

  if (classification === 'qualified') {
    const { data: existingBill } = await supabase
      .from('billed_events')
      .select('id')
      .eq('reply_id', replyId)
      .maybeSingle()

    if (!existingBill) {
      const { count } = await supabase
        .from('billed_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'paid')

      const isFreeFirstReply = (count ?? 0) === 0

      await supabase.from('billed_events').insert({
        user_id: user.id,
        reply_id: replyId,
        amount_cents: 5000,
        status: isFreeFirstReply ? 'waived' : 'pending',
        is_free_first_reply: isFreeFirstReply,
      })
    }
  }

  return NextResponse.json({ classification })
}
