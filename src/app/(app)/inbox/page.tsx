export default function InboxPage() {
  const threads = [
    { id: '1', from: 'Carillo Bros.', snippet: '"Yes please send the sample. We\'re starting framing in 3 weeks and could use a sanity check…"', tag: 'qualified', permit: '1247 N Crescent Heights Blvd', time: '12 min ago' },
    { id: '2', from: 'Westside Builders', snippet: '"What\'s your turnaround on a 640 sqft ADU? We have another project as well if pricing is right."', tag: 'question', permit: '2418 Beverwil Dr', time: '2h ago' },
    { id: '3', from: 'Pacific Coast Interiors', snippet: '"Thanks, not looking for takeoffs right now — we have an in-house estimator."', tag: 'later', permit: '523 N Crescent Dr', time: 'Yesterday' },
  ]

  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Inbox</h1>
          <span className="topbar-meta">3 qualified replies</span>
        </div>
      </div>

      <div className="inbox-stats">
        <div className="stat-col">
          <div className="stat-label">Qualified replies</div>
          <div className="stat-num green">1</div>
        </div>
        <div className="stat-col">
          <div className="stat-label">Emails sent</div>
          <div className="stat-num">28</div>
        </div>
        <div className="stat-col">
          <div className="stat-label">Open rate</div>
          <div className="stat-num"><em>61%</em></div>
        </div>
        <div className="stat-col">
          <div className="stat-label">Total spent</div>
          <div className="stat-num">$0</div>
        </div>
      </div>

      <div className="thread-list">
        {threads.map(t => (
          <div key={t.id} className="thread-item">
            <span className={`thread-dot ${t.tag}`} />
            <div className="thread-body">
              <div className="thread-from">{t.from}</div>
              <div className="thread-snippet">{t.snippet}</div>
              <div className="thread-meta">
                <span className={`thread-tag ${t.tag}`}>
                  {t.tag === 'qualified' ? '● Qualified' : t.tag === 'question' ? '? Question' : '— Not now'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-3)' }}>{t.permit}</span>
              </div>
            </div>
            <div className="thread-time">{t.time}</div>
          </div>
        ))}
      </div>
    </>
  )
}
