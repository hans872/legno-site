import { task } from '@trigger.dev/sdk/v3'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type Classification = 'qualified' | 'question' | 'not_now' | 'auto_reply'

export const classifyReplyTask = task({
  id: 'classify-reply',
  maxDuration: 30,
  run: async ({ replyId, userId }: { replyId: string; userId: string }) => {
    const { data: reply } = await supabase
      .from('replies')
      .select('*')
      .eq('id', replyId)
      .single()

    if (!reply) return { skipped: true }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      system: `Classify email replies to cold outreach from blueprint estimators. Reply with exactly one word:
- "qualified" — contractor is interested, wants to proceed, or asks for a sample/quote
- "question" — asking for more info but seems interested
- "not_now" — not interested, politely declines, or already has someone
- "auto_reply" — out of office, bounce, or automated response`,
      messages: [{ role: 'user', content: `Classify:\n\n${(reply.body ?? '').slice(0, 800)}` }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim().toLowerCase() : 'not_now'
    const classification: Classification = ['qualified', 'question', 'not_now', 'auto_reply'].includes(raw)
      ? (raw as Classification)
      : 'not_now'

    await supabase.from('replies').update({
      classification,
      classified_at: new Date().toISOString(),
    }).eq('id', replyId)

    if (classification === 'qualified') {
      const { data: existing } = await supabase
        .from('billed_events')
        .select('id')
        .eq('reply_id', replyId)
        .maybeSingle()

      if (!existing) {
        const { count } = await supabase
          .from('billed_events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('status', 'pending')

        const isFreeFirstReply = (count ?? 0) === 0

        await supabase.from('billed_events').insert({
          user_id: userId,
          reply_id: replyId,
          amount_cents: 5000,
          status: isFreeFirstReply ? 'waived' : 'pending',
          is_free_first_reply: isFreeFirstReply,
        })
      }
    }

    return { classification }
  },
})
