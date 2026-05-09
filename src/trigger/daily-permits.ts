import { schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'

const LADBS_URL = 'https://data.lacity.org/resource/nbyu-2ha9.json'
const PAGE_SIZE = 200

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const dailyPermitPull = schedules.task({
  id: 'daily-permit-pull',
  cron: '0 6 * * *', // 6 AM Pacific daily
  maxDuration: 300,
  run: async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const since = yesterday.toISOString().split('T')[0]

    let offset = 0
    let total = 0

    while (true) {
      const url = new URL(LADBS_URL)
      url.searchParams.set('$where', `date_filed >= '${since}'`)
      url.searchParams.set('$limit', String(PAGE_SIZE))
      url.searchParams.set('$offset', String(offset))
      url.searchParams.set('$$app_token', process.env.LADBS_APP_TOKEN!)

      const res = await fetch(url.toString())
      if (!res.ok) break

      const rows: Record<string, string>[] = await res.json()
      if (!rows.length) break

      const permits = rows.map(r => ({
        permit_number:   r.permit_nbr ?? r.permit_number ?? '',
        address:         [r.addr_street_nb, r.addr_street_dir, r.addr_street_nm, r.addr_street_sfx].filter(Boolean).join(' '),
        description:     r.work_description ?? r.permit_description ?? '',
        work_type:       r.permit_type ?? '',
        valuation:       r.valuation ? parseFloat(r.valuation) : null,
        sqft:            r.floor_area_l_a_building_code_definition ? parseFloat(r.floor_area_l_a_building_code_definition) : null,
        applicant_name:  r.applicant_first_name ? `${r.applicant_first_name} ${r.applicant_last_name ?? ''}`.trim() : null,
        contractor_name: r.contractor_business_name ?? null,
        contractor_lic:  r.license_number ?? null,
        status:          r.status_date ? 'active' : 'pending',
        filed_at:        r.date_filed ? new Date(r.date_filed).toISOString() : new Date().toISOString(),
        raw:             r,
      })).filter(p => p.permit_number)

      if (permits.length) {
        const { error } = await supabase
          .from('permits')
          .upsert(permits, { onConflict: 'permit_number', ignoreDuplicates: true })
        if (error) console.error('upsert error:', error.message)
        total += permits.length
      }

      if (rows.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    console.log(`Ingested ${total} permits since ${since}`)
    return { total }
  },
})
