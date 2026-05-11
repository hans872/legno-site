import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { companyName } = await request.json()
  if (!companyName) return NextResponse.json({ error: 'companyName required' }, { status: 400 })

  const apiKey = process.env.HUNTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Hunter not configured' }, { status: 503 })

  const url = new URL('https://api.hunter.io/v2/domain-search')
  url.searchParams.set('company', companyName)
  url.searchParams.set('limit', '5')
  url.searchParams.set('api_key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'Hunter request failed', detail: text }, { status: 502 })
  }

  const json = await res.json()
  const ARCH_TERMS = ['architect', 'principal', 'aia', 'design director', 'project manager']
  const emails: { name: string; title: string | null; email: string }[] =
    (json.data?.emails ?? []).map((e: Record<string, unknown>) => ({
      name: [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Unknown',
      title: e.position ? String(e.position) : null,
      email: String(e.value ?? ''),
    }))
    .filter((e: { email: string }) => e.email)
    .sort((a: { title: string | null }, b: { title: string | null }) => {
      const aArch = ARCH_TERMS.some(t => a.title?.toLowerCase().includes(t)) ? 1 : 0
      const bArch = ARCH_TERMS.some(t => b.title?.toLowerCase().includes(t)) ? 1 : 0
      return bArch - aArch
    })

  return NextResponse.json({ people: emails, domain: json.data?.domain ?? null })
}
