'use client'

import { useState } from 'react'
import Link from 'next/link'

type Permit = {
  id: string
  address: string
  description: string
  valuation: string
  permitNumber: string
  type: 'new-build' | 'adu' | 'remodel' | 'other'
  sqft: string
  contractor: string
  filed: string
  draft?: string
  subject?: string
}

const SAMPLE_PERMITS: Permit[] = [
  {
    id: '1',
    address: '1247 N Crescent Heights Blvd',
    description: '3,400 sqft single-family — new construction',
    valuation: '$1.42M',
    permitNumber: 'LA-25-104782',
    type: 'new-build',
    sqft: '3,400 sqft',
    contractor: 'Carillo Brothers GC',
    filed: 'Today, 6:12 AM',
    subject: 'Blueprint takeoff · 1247 N Crescent Heights Blvd',
    draft: `Hi Mr. Carillo,

Congrats on the permit at 1247 N Crescent Heights Blvd. We do blueprint takeoffs for hillside SFRs across the Westside — typically a 48-hour turnaround on a 3,400 sqft scope like this one.

Happy to send a sample takeoff if useful? No charge for the first look.`,
  },
  {
    id: '2',
    address: '2418 Beverwil Dr',
    description: 'ADU — detached 640 sqft, solar rough',
    valuation: '$218K',
    permitNumber: 'LA-25-104779',
    type: 'adu',
    sqft: '640 sqft',
    contractor: 'Westside Builders',
    filed: 'Today, 7:44 AM',
    subject: 'ADU takeoff · 2418 Beverwil Dr',
    draft: `Hi team at Westside Builders,

Noticed the ADU permit at 2418 Beverwil Dr — a 640 sqft detached with solar rough is right in our wheelhouse. We do ADU blueprint takeoffs daily and can turn around a complete materials estimate in 48 hours.

Want a sample for this one?`,
  },
  {
    id: '3',
    address: '523 N Crescent Dr, Beverly Hills',
    description: 'Major remodel — kitchen + 2 baths, 2nd story addition',
    valuation: '$680K',
    permitNumber: 'LA-25-104774',
    type: 'remodel',
    sqft: '1,800 sqft',
    contractor: 'Pacific Coast Interiors',
    filed: 'Today, 9:02 AM',
    draft: undefined,
  },
]

type Filter = 'all' | 'new-build' | 'adu' | 'remodel'

export default function PermitsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()

  const filtered = filter === 'all' ? SAMPLE_PERMITS : SAMPLE_PERMITS.filter(p => p.type === filter)
  const counts = {
    all: SAMPLE_PERMITS.length,
    'new-build': SAMPLE_PERMITS.filter(p => p.type === 'new-build').length,
    adu: SAMPLE_PERMITS.filter(p => p.type === 'adu').length,
    remodel: SAMPLE_PERMITS.filter(p => p.type === 'remodel').length,
  }

  function handleSend(permit: Permit) {
    setSent(s => new Set([...s, permit.id]))
    setExpanded(null)
  }

  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Permits</h1>
          <span className="topbar-meta">{today} · Los Angeles</span>
        </div>
        <div className="topbar-actions">
          <button className="icon-btn" title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button className="icon-btn" title="Filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="feed">
        {/* Voice setup nudge */}
        <div className="nudge">
          <div className="nudge-content">
            <div className="nudge-eye">Personalize · 2 min</div>
            <h3>Set your <em>voice</em> so we can write like you do.</h3>
            <p>Your drafts are good. They get great when we know your tone, your sign-off, and how you pitch a hillside SFR vs an ADU.</p>
          </div>
          <Link href="/voice" className="nudge-cta">
            Set up voice
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Filter row */}
        <div className="feed-head">
          <span className="feed-eye">{counts.all} new permits · today</span>
          <div className="chips">
            {(['all', 'new-build', 'adu', 'remodel'] as Filter[]).map(f => (
              <button
                key={f}
                className={`chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'new-build' ? 'New build' : f === 'adu' ? 'ADU' : 'Remodel'}
                {counts[f] > 0 && <span className="chip-count">{counts[f]}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="cards">
          {filtered.map(permit => (
            <div
              key={permit.id}
              className={`permit-card${expanded === permit.id ? ' expanded' : ''}${sent.has(permit.id) ? ' sent' : ''}`}
              style={sent.has(permit.id) ? { opacity: 0.5 } : {}}
            >
              <div className="card-head" onClick={() => setExpanded(expanded === permit.id ? null : permit.id)}>
                <div className="card-headline">
                  <div className="card-tags">
                    <span className={`tag ${permit.type}`}>
                      {permit.type === 'new-build' ? 'New build' : permit.type === 'adu' ? 'ADU' : 'Remodel'}
                    </span>
                    <span className="tag fresh">Fresh</span>
                  </div>
                  <div className="card-title">{permit.description}</div>
                  <div className="card-addr">{permit.address}</div>
                </div>
                <div className="card-right">
                  <div className="card-value">{permit.valuation}</div>
                  <div className="card-pid">{permit.permitNumber}</div>
                </div>
              </div>

              <div className="card-meta">
                <div className="meta-col">
                  <div className="meta-label">Sq ft</div>
                  <div className="meta-val">{permit.sqft}</div>
                </div>
                <div className="meta-col">
                  <div className="meta-label">Contractor</div>
                  <div className="meta-val">{permit.contractor}</div>
                </div>
                <div className="meta-col">
                  <div className="meta-label">Filed</div>
                  <div className="meta-val mono">{permit.filed}</div>
                </div>
              </div>

              {permit.draft && (
                <div className="draft-area">
                  <div className="draft-head">
                    <div className="draft-label">
                      <span className="draft-pulse" />
                      Draft · Claude
                    </div>
                    <div className="voice-tag">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                      Your voice
                    </div>
                  </div>

                  <div className="subject-plus-body">
                    {permit.subject && (
                      <div className="draft-subject">
                        <span className="s-label">Subject</span>
                        <span className="s-value">{permit.subject}</span>
                      </div>
                    )}
                    <div className="draft-body">
                      {permit.draft}
                    </div>
                  </div>

                  <div className="draft-actions">
                    <button className="btn-edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button className="btn-skip" onClick={() => setExpanded(null)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Skip
                    </button>
                    <button className="btn-send" onClick={() => handleSend(permit)}>
                      Send
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                  <div className="draft-note">Sent from your Gmail · Can-SPAM compliant</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="feed-foot">End of today&apos;s permits · Next pull tomorrow at 6 AM</div>
      </div>
    </>
  )
}
