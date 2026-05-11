import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: replies }, { count: sentCount }, { count: qualifiedCount }, { data: billing }] =
    await Promise.all([
      supabase
        .from('replies')
        .select('id, from_name, from_address, subject, body, classification, received_at, outreach(id, to_address)')
        .eq('user_id', user!.id)
        .order('received_at', { ascending: false })
        .limit(50),
      supabase
        .from('outreach')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'sent'),
      supabase
        .from('replies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('classification', 'qualified'),
      supabase
        .from('billed_events')
        .select('amount_cents, status')
        .eq('user_id', user!.id)
        .eq('status', 'paid'),
    ])

  const totalSpent = (billing ?? []).reduce((sum, b) => sum + b.amount_cents, 0)

  function tagLabel(c: string | null) {
    if (c === 'qualified') return '● Qualified'
    if (c === 'question') return '? Question'
    if (c === 'not_now') return '— Not now'
    if (c === 'auto_reply') return '↩ Auto-reply'
    return '· Unclassified'
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Inbox</h1>
          <span className="topbar-meta">
            {qualifiedCount ?? 0} qualified {(qualifiedCount ?? 0) === 1 ? 'reply' : 'replies'}
          </span>
        </div>
      </div>

      <div className="inbox-stats">
        <div className="stat-col">
          <div className="stat-label">Qualified replies</div>
          <div className="stat-num green">{qualifiedCount ?? 0}</div>
        </div>
        <div className="stat-col">
          <div className="stat-label">Emails sent</div>
          <div className="stat-num">{sentCount ?? 0}</div>
        </div>
        <div className="stat-col">
          <div className="stat-label">Total replies</div>
          <div className="stat-num">{replies?.length ?? 0}</div>
        </div>
        <div className="stat-col">
          <div className="stat-label">Total spent</div>
          <div className="stat-num">${(totalSpent / 100).toFixed(0)}</div>
        </div>
      </div>

      <div className="thread-list">
        {!replies || replies.length === 0 ? (
          <div style={{
            padding: '60px 32px',
            textAlign: 'center',
            color: 'var(--ink-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.04em',
          }}>
            No replies yet — send your first email from the Permits tab.
          </div>
        ) : (
          replies.map(r => (
            <div key={r.id} className="thread-item">
              <span className={`thread-dot ${r.classification ?? 'unclassified'}`} />
              <div className="thread-body">
                <div className="thread-from">{r.from_name || r.from_address}</div>
                <div className="thread-snippet">{r.body?.slice(0, 120)}…</div>
                <div className="thread-meta">
                  <span className={`thread-tag ${r.classification ?? 'unclassified'}`}>
                    {tagLabel(r.classification)}
                  </span>
                </div>
              </div>
              <div className="thread-time">{timeAgo(r.received_at)}</div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
