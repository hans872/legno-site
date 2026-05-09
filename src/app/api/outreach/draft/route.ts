import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { permitId } = await request.json()

  const [permitResult, voiceResult, profileResult] = await Promise.all([
    supabase.from('permits').select('*').eq('id', permitId).single(),
    supabase.from('voice_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
  ])

  if (permitResult.error || !permitResult.data) {
    return NextResponse.json({ error: 'Permit not found' }, { status: 404 })
  }

  const permit = permitResult.data
  const voice = voiceResult.data
  const profile = profileResult.data

  const tone = voice?.tone ?? 'warm'
  const signature = voice?.signature ?? `— ${profile?.first_name ?? 'Your name'}\n${profile?.company ?? 'Your company'}`
  const writingSample = voice?.writing_sample

  const systemPrompt = `You are a ghostwriter for a blueprint estimator or small construction contractor.
Write cold outreach emails to contractors who just pulled building permits.
Tone: ${tone === 'warm' ? 'friendly and human, like a real person on a coffee break' : tone === 'direct' ? 'short, no fluff, get to the point in 2 sentences' : 'professional and polished'}.
${writingSample ? `Match this writing style closely:\n"""\n${writingSample}\n"""` : ''}
Write ONLY the email body (no subject line). No fluff opening like "I hope this finds you well."
End with exactly this signature:\n${signature}
Keep it under 120 words.`

  const userPrompt = `Write a cold outreach email to the contractor on this permit:
Address: ${permit.address}
Description: ${permit.description}
Valuation: $${permit.valuation ? Number(permit.valuation).toLocaleString() : 'unknown'}
Sq ft: ${permit.sqft ?? 'unknown'}
Contractor: ${permit.contractor_name ?? permit.applicant_name ?? 'the contractor'}
Work type: ${permit.work_type ?? 'construction'}

My company does blueprint takeoffs and estimating services. Pitch our speed (48-hour turnaround) and offer to send a sample.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const body = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  const subject = `Blueprint takeoff · ${permit.address}`

  const { data: outreach, error } = await supabase
    .from('outreach')
    .insert({
      user_id: user.id,
      permit_id: permitId,
      to_address: '',
      subject,
      body,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ outreach, subject, body })
}
