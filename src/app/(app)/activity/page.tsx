export default function ActivityPage() {
  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Activity</h1>
          <span className="topbar-meta">Billing &amp; ROI</span>
        </div>
      </div>

      <div className="app-page">
        <div className="app-card" style={{ padding: '32px', marginBottom: 28, textAlign: 'center', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(244,239,230,0.55)', marginBottom: 8 }}>Total spent</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 64, letterSpacing: '-0.03em', lineHeight: 1 }}>$0</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(244,239,230,0.55)', marginTop: 8 }}>First reply still on us</div>
        </div>

        <div className="app-section">
          <div className="app-section-title">Stats this week</div>
          <div className="app-card">
            <div className="app-row">
              <div className="app-row-label"><strong>Emails sent</strong><span>Outreach via Gmail</span></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' }}>28</div>
            </div>
            <div className="app-row">
              <div className="app-row-label"><strong>Open rate</strong><span>Unique opens tracked</span></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--success)' }}>61%</div>
            </div>
            <div className="app-row">
              <div className="app-row-label"><strong>Qualified replies</strong><span>Contractors who responded with intent</span></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--success)' }}>1</div>
            </div>
            <div className="app-row">
              <div className="app-row-label"><strong>Billed replies</strong><span>Replies charged at $50 each</span></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' }}>0</div>
            </div>
          </div>
        </div>

        <div className="app-section">
          <div className="app-section-title">Payment method</div>
          <div className="app-card">
            <div className="app-row">
              <div className="app-row-label"><strong>Card on file</strong><span>Required before first send</span></div>
              <button style={{ padding: '8px 16px', border: '1px solid var(--border-strong)', borderRadius: 4, background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: 'var(--ink)' }}>
                Add card
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
