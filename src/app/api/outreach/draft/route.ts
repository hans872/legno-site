import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type PermitType = 'ground-up' | 'adu' | 'remodel' | 'other'

function classifyPermit(workType: string, description: string): PermitType {
  const text = `${workType} ${description}`.toLowerCase()
  if (text.includes('adu') || text.includes('accessory dwelling unit')) return 'adu'
  if (
    text.includes('new construction') || text.includes('new single') ||
    text.includes('new 1 family') || text.includes('new dwelling') ||
    text.includes('full remodel') || text.includes('complete remodel') ||
    text.includes('full home remodel')
  ) return 'ground-up'
  if (text.includes('remodel') || text.includes('alteration') || text.includes('addition') || text.includes('renovation')) return 'remodel'
  return 'other'
}

function applyTemplate(template: string, permit: Record<string, unknown>): string {
  return template
    .replace(/\{\{contractor_name\}\}/g, String(permit.contractor_name ?? permit.applicant_name ?? 'there'))
    .replace(/\{\{address\}\}/g, String(permit.address ?? ''))
    .replace(/\{\{permit_number\}\}/g, String(permit.permit_number ?? ''))
    .replace(/\{\{sqft\}\}/g, permit.sqft ? `${Number(permit.sqft).toLocaleString()} sqft` : '')
    .replace(/\{\{valuation\}\}/g, permit.valuation ? `$${Number(permit.valuation).toLocaleString()}` : '')
}

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
  const signature = voice?.signature ?? `— ${profile?.first_name ?? 'Your name'}\n${profile?.company ?? 'Your company'}`
  const permitType = classifyPermit(permit.work_type ?? '', permit.description ?? '')

  const templates = voice?.templates as Record<string, { subject: string; body: string }> | null
  const tpl = templates?.[permitType]

  let subject: string
  let body: string

  if (tpl?.subject && tpl?.body) {
    subject = applyTemplate(tpl.subject, permit)
    body = applyTemplate(tpl.body, permit) + (signature ? `\n\n${signature}` : '')
  } else {
    const writingSample = voice?.writing_sample
    const recipientLabel = (permitType === 'ground-up' || permitType === 'remodel') ? 'architect' : 'contractor'
    const systemPrompt = `You are a ghostwriter for a blueprint estimator or small construction contractor.
Write cold outreach emails to ${recipientLabel === 'architect' ? 'architects on building projects' : 'contractors who just pulled building permits'}.
Be friendly and human — like a real person, not marketing copy.
${writingSample ? `Match this writing style closely:\n"""\n${writingSample}\n"""` : ''}
Write ONLY the email body (no subject line). No fluff opening like "I hope this finds you well."
End with exactly this signature:\n${signature}
Keep it under 120 words.`

    const userPrompt = `Write a cold outreach email to the ${recipientLabel} on this permit:
Address: ${permit.address}
Description: ${permit.description}
Valuation: $${permit.valuation ? Number(permit.valuation).toLocaleString() : 'unknown'}
Sq ft: ${permit.sqft ?? 'unknown'}
${recipientLabel === 'architect' ? 'Architect' : 'Contractor'}: ${permit.contractor_name ?? permit.applicant_name ?? `the ${recipientLabel}`}
Work type: ${permit.work_type ?? 'construction'}

My company does blueprint takeoffs and estimating services. Pitch our speed (48-hour turnaround) and offer to send a sample.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })

    body = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    subject = `Blueprint takeoff · ${permit.address}`
  }

  const { data: outreach, error } = await supabase
    .from('outreach')
    .insert({ user_id: user.id, permit_id: permitId, to_address: '', subject, body, status: 'draft' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ outreach, subject, body })
}
