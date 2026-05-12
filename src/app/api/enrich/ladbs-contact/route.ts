import { NextResponse } from 'next/server'

const LADBS_CONTACT_URL = 'https://data.lacity.org/resource/hbkd-qubn.json'

function parseAddress(address: string): { addressStart: string; streetName: string } {
  const withoutZip = address.split(',')[0].trim()
  const parts = withoutZip.split(/\s+/)
  if (parts.length < 3) return { addressStart: '', streetName: '' }

  const addressStart = parts[0]
  let idx = 1

  const directions = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']
  if (directions.includes(parts[idx])) idx++

  // Street name is between direction and suffix (last word)
  const streetName = parts.slice(idx, parts.length - 1).join(' ')

  return { addressStart, streetName }
}

export async function POST(request: Request) {
  const { address } = await request.json()
  if (!address) return NextResponse.json({ contacts: [] })

  const { addressStart, streetName } = parseAddress(address)
  if (!addressStart || !streetName) return NextResponse.json({ contacts: [] })

  const url = new URL(LADBS_CONTACT_URL)
  url.searchParams.set(
    '$where',
    `address_start='${addressStart}' AND street_name='${streetName.replace(/'/g, "''")}'`
  )
  url.searchParams.set('$order', 'issue_date DESC')
  url.searchParams.set('$limit', '20')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return NextResponse.json({ contacts: [] })

  const rows: Record<string, string>[] = await res.json()

  const seen = new Set<string>()
  const contacts: { company: string; name: string; issueDate: string }[] = []

  for (const r of rows) {
    const company = r.contractors_business_name
    if (!company || seen.has(company)) continue
    seen.add(company)
    const firstName = r.applicant_first_name || r.principal_first_name || ''
    const lastName = r.applicant_last_name || r.principal_last_name || ''
    const name = [firstName, lastName].filter(Boolean).join(' ')
    contacts.push({ company, name, issueDate: (r.issue_date ?? '').slice(0, 10) })
    if (contacts.length >= 3) break
  }

  return NextResponse.json({ contacts })
}
