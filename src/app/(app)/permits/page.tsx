import { createClient } from '@/lib/supabase/server'
import PermitsFeed, { type PermitRow } from './PermitsFeed'

export const revalidate = 0

export default async function PermitsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('permits')
    .select('id, address, description, valuation, permit_number, work_type, sqft, contractor_name, contractor_lic, applicant_name, filed_at, raw')
    .order('filed_at', { ascending: false })
    .limit(50)

  const permits: PermitRow[] = data ?? []

  return <PermitsFeed permits={permits} />
}
