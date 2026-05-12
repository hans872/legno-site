import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Building and Safety - Building Permits Issued from 2020 to Present
const LADBS_URL = 'https://data.lacity.org/resource/pi9x-tg5x.json'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const url = new URL(LADBS_URL)
  url.searchParams.set('$limit', '50')
  url.searchParams.set('$order', 'issue_date DESC')
  // Focus on meaningful permit types (exclude express/re-roof noise)
  url.searchParams.set('$where', `permit_group='Building' AND valuation > '50000'`)

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (process.env.LADBS_APP_TOKEN) headers['X-App-Token'] = process.env.LADBS_APP_TOKEN

  const res = await fetch(url.toString(), { cache: 'no-store', headers })
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'LADBS fetch failed', status: res.status, detail: text }, { status: 502 })
  }

  const rows: Record<string, string>[] = await res.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ ingested: 0, note: 'No rows returned from LADBS' })
  }

  const permits = rows
    .map(r => ({
      permit_number:   r.permit_nbr ?? '',
      address:         r.primary_address
                         ? `${r.primary_address}${r.zip_code ? ', ' + r.zip_code : ''}`
                         : '',
      description:     r.work_desc ?? r.use_desc ?? '',
      work_type:       r.permit_sub_type ?? r.permit_type ?? '',
      valuation:       r.valuation ? parseFloat(r.valuation) : null,
      sqft:            r.square_footage ? parseFloat(r.square_footage) : null,
      applicant_name:  null,
      contractor_name: r.business_unit ?? null,
      contractor_lic:  null,
      status:          r.status_desc ?? 'issued',
      filed_at:        r.issue_date
                         ? new Date(r.issue_date).toISOString()
                         : r.submitted_date
                         ? new Date(r.submitted_date).toISOString()
                         : new Date().toISOString(),
      raw: r,
    }))
    .filter(p => p.permit_number && p.address)

  const { error } = await supabase
    .from('permits')
    .upsert(permits, { onConflict: 'permit_number', ignoreDuplicates: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ingested: permits.length })
}
