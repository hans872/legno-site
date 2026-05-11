'use client'

import { useState } from 'react'
import Link from 'next/link'

type PermitType = 'ground-up' | 'adu' | 'remodel' | 'other'
type Filter = 'all' | PermitType

export type PermitRow = {
  id: string
  address: string
  description: string
  valuation: number | null
  permit_number: string
  work_type: string
  sqft: number | null
  contractor_name: string | null
  contractor_lic: string | null
  applicant_name: string | null
  filed_at: string
  raw: Record<string, string> | null
}

function classifyPermit(workType: string, description: string): PermitType {
  const text = `${workType} ${description}`.toLowerCase()
  if (text.includes('adu') || text.includes('accessory dwelling unit')) return 'adu'
  if (
    text.includes('new construction') ||
    text.includes('new single') ||
    text.includes('new 1 family') ||
    text.includes('new dwelling') ||
    text.includes('full remodel') ||
    text.includes('complete remodel') ||
    text.includes('full home remodel')
  ) return 'ground-up'
  if (
    text.includes('remodel') ||
    text.includes('alteration') ||
    text.includes('addition') ||
    text.includes('renovation')
  ) return 'remodel'
  return 'other'
}

function formatValuation(v: number | null): string {
  if (!v) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function formatSqft(s: number | null): string {
  if (!s) return '—'
  return `${s.toLocaleString()} sqft`
}

function formatFiled(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type ApolloContact = { name: string; title: string | null; email: string | null; organization_name: string | null }

export default function PermitsFeed({ permits }: { permits: PermitRow[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [outreachIds, setOutreachIds] = useState<Record<string, string>>({})
  const [toEmails, setToEmails] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lookupQuery, setLookupQuery] = useState<Record<string, string>>({})
  const [lookupLoading, setLookupLoading] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Record<string, ApolloContact[]>>({})

  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()

  const classified = permits.map(p => ({
    ...p,
    type: classifyPermit(p.work_type, p.description),
  }))

  const filtered = filter === 'all' ? classified : classified.filter(p => p.type === filter)

  const counts = {
    all: classified.length,
    'ground-up': classified.filter(p => p.type === 'ground-up').length,
    adu: classified.filter(p => p.type === 'adu').length,
    remodel: classified.filter(p => p.type === 'remodel').length,
    other: classified.filter(p => p.type === 'other').length,
  }

  async function handleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    // Pre-fill lookup query from permit's contractor name if available
    const permit = classified.find(p => p.id === id)
    if (permit?.contractor_name && !lookupQuery[id]) {
      setLookupQuery(q => ({ ...q, [id]: permit.contractor_name! }))
    }
    if (!drafts[id]) {
      setLoading(id)
      try {
        const res = await fetch('/api/outreach/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permitId: id }),
        })
        if (res.ok) {
          const data = await res.json()
          setDrafts(d => ({ ...d, [id]: data.body }))
          setOutreachIds(o => ({ ...o, [id]: data.outreach.id }))
        } else {
          setErrors(e => ({ ...e, [id]: 'Could not generate draft.' }))
        }
      } finally {
        setLoading(null)
      }
    }
  }

  async function handleLookup(id: string) {
    const query = lookupQuery[id]?.trim()
    if (!query) return
    setLookupLoading(id)
    try {
      const res = await fetch('/api/enrich/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: query }),
      })
      const data = await res.json()
      setContacts(c => ({ ...c, [id]: data.people ?? [] }))
    } finally {
      setLookupLoading(null)
    }
  }

  async function handleSend(id: string) {
    const to = toEmails[id]?.trim()
    if (!to || !to.includes('@')) {
      setErrors(e => ({ ...e, [id]: 'Enter the recipient email address first.' }))
      return
    }
    const outreachId = outreachIds[id]
    if (!outreachId) {
      setErrors(e => ({ ...e, [id]: 'Draft not ready yet — wait a moment and try again.' }))
      return
    }
    setSending(id)
    setErrors(e => ({ ...e, [id]: '' }))
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outreachId, to }),
      })
      if (res.ok) {
        setSent(s => new Set([...s, id]))
        setExpanded(null)
      } else {
        const data = await res.json()
        setErrors(e => ({ ...e, [id]: data.error ?? 'Send failed. Check that Gmail is connected.' }))
      }
    } catch {
      setErrors(e => ({ ...e, [id]: 'Network error — please try again.' }))
    } finally {
      setSending(null)
    }
  }

  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Permits</h1>
          <span className="topbar-meta">{today} · Los Angeles</span>
        </div>
      </div>

      <div className="feed">
        <div className="nudge">
          <div className="nudge-content">
            <div className="nudge-eye">Personalize · 2 min</div>
            <h3>Set up your <em>templates</em> so we write like you do.</h3>
            <p>Your drafts are good. They get great when we have your templates for each permit type and your sign-off.</p>
          </div>
          <Link href="/voice" className="nudge-cta">
            Set up templates
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="feed-head">
          <span className="feed-eye">{counts.all} permits · this week</span>
          <div className="chips">
            {(['all', 'ground-up', 'adu', 'remodel', 'other'] as Filter[]).map(f => (
              counts[f as keyof typeof counts] > 0 || f === 'all' ? (
                <button
                  key={f}
                  className={`chip${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'ground-up' ? 'Ground up' : f === 'adu' ? 'ADU' : f === 'remodel' ? 'Remodel' : 'Other'}
                  {counts[f as keyof typeof counts] > 0 && (
                    <span className="chip-count">{counts[f as keyof typeof counts]}</span>
                  )}
                </button>
              ) : null
            ))}
          </div>
        </div>

        <div className="cards">
          {filtered.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              No permits yet — the weekly pull runs every Monday at 6 AM.
            </div>
          )}
          {filtered.map(permit => (
            <div
              key={permit.id}
              className={`permit-card${expanded === permit.id ? ' expanded' : ''}${sent.has(permit.id) ? ' sent' : ''}`}
              style={sent.has(permit.id) ? { opacity: 0.5 } : {}}
            >
              <div className="card-head" onClick={() => handleExpand(permit.id)}>
                <div className="card-headline">
                  <div className="card-tags">
                    <span className={`tag ${permit.type}`}>
                      {permit.type === 'ground-up' ? 'Ground up' : permit.type === 'adu' ? 'ADU' : permit.type === 'remodel' ? 'Remodel' : 'Other'}
                    </span>
                    <span className="tag fresh">Fresh</span>
                  </div>
                  <div className="card-title">{permit.description || permit.work_type || 'Permit'}</div>
                  <div className="card-addr">{permit.address}</div>
                </div>
                <div className="card-right">
                  <div className="card-value">{formatValuation(permit.valuation)}</div>
                  <span className="card-pid">{permit.permit_number}</span>
                </div>
              </div>

              <div className="card-meta">
                <div className="meta-col">
                  <div className="meta-label">Sq ft</div>
                  <div className="meta-val">{formatSqft(permit.sqft)}</div>
                </div>
                <div className="meta-col">
                  <div className="meta-label">Filed</div>
                  <div className="meta-val mono">{formatFiled(permit.filed_at)}</div>
                </div>
                <div className="meta-col">
                  <div className="meta-label">Valuation</div>
                  <div className="meta-val">{formatValuation(permit.valuation)}</div>
                </div>
              </div>

              <div className="card-contact">
                {(permit.raw?.cnc || permit.raw?.cpa) && (
                  <div className="contact-row">
                    <span className="contact-label">Neighborhood</span>
                    <span className="contact-val">{permit.raw?.cnc || permit.raw?.cpa}</span>
                  </div>
                )}
                <div className="contact-row">
                  <span className="contact-label">Permit type</span>
                  <span className="contact-val">{permit.raw?.permit_sub_type || permit.work_type || '—'}</span>
                </div>
                {(permit.raw?.owner_name || permit.raw?.applicant || permit.contractor_name) && (
                  <div className="contact-row">
                    <span className="contact-label">Owner / Applicant</span>
                    <span className="contact-val">
                      {permit.raw?.owner_name || permit.raw?.applicant || permit.contractor_name}
                    </span>
                  </div>
                )}
                {permit.contractor_name && (
                  <div className="contact-row">
                    <span className="contact-label">Contractor</span>
                    <span className="contact-val">{permit.contractor_name}</span>
                  </div>
                )}
                <div className="contact-row">
                  <span className="contact-label">Permit #</span>
                  <button
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(permit.permit_number + ' LADBS Los Angeles building permit')}`, '_blank')}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11,
                      textDecoration: 'underline', cursor: 'pointer', letterSpacing: '0.04em',
                    }}
                  >
                    {permit.permit_number} ↗
                  </button>
                </div>

                {/* Apollo contact lookup */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Company name to look up…"
                    value={lookupQuery[permit.id] ?? ''}
                    onChange={e => setLookupQuery(q => ({ ...q, [permit.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleLookup(permit.id)}
                    style={{
                      flex: 1, border: '1px solid var(--border)', background: 'var(--surface)',
                      borderRadius: 4, padding: '7px 11px', fontFamily: 'var(--font-body)',
                      fontSize: 13, color: 'var(--ink)', outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleLookup(permit.id)}
                    disabled={lookupLoading === permit.id}
                    style={{
                      padding: '7px 14px', background: 'var(--ink)', color: 'var(--paper)',
                      border: 0, borderRadius: 4, fontFamily: 'var(--font-body)', fontWeight: 600,
                      fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                      opacity: lookupLoading === permit.id ? 0.6 : 1,
                    }}
                  >
                    {lookupLoading === permit.id ? 'Looking…' : 'Find contact'}
                  </button>
                </div>

                {/* Apollo results */}
                {contacts[permit.id] !== undefined && (
                  <div style={{ marginTop: 8 }}>
                    {contacts[permit.id].length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '6px 0' }}>No contacts found — try a different company name.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {contacts[permit.id].map((c, i) => (
                          <button
                            key={i}
                            onClick={() => c.email && setToEmails(t => ({ ...t, [permit.id]: c.email! }))}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: 12, padding: '8px 12px', border: '1px solid var(--border)',
                              borderRadius: 4, background: toEmails[permit.id] === c.email ? 'var(--surface-2)' : 'var(--surface)',
                              cursor: c.email ? 'pointer' : 'default', textAlign: 'left', width: '100%',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{c.name}</div>
                              {c.title && <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{c.title}</div>}
                            </div>
                            <div style={{ fontSize: 12, color: c.email ? 'var(--accent)' : 'var(--ink-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                              {c.email ?? 'no email'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {expanded === permit.id && (
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
                      Your template
                    </div>
                  </div>

                  <div className="subject-plus-body">
                    <div className="draft-body">
                      {loading === permit.id
                        ? 'Writing draft…'
                        : (drafts[permit.id] || 'Could not generate draft — check your templates.')}
                    </div>
                  </div>

                  {/* Recipient email */}
                  <div style={{ margin: '14px 0 4px' }}>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 6 }}>
                      Recipient email
                    </label>
                    <input
                      type="email"
                      placeholder={permit.type === 'ground-up' || permit.type === 'remodel' ? 'architect@firm.com' : 'recipient@example.com'}
                      value={toEmails[permit.id] ?? ''}
                      onChange={e => setToEmails(t => ({ ...t, [permit.id]: e.target.value }))}
                      style={{
                        width: '100%', border: '1px solid var(--border)', background: 'var(--surface)',
                        borderRadius: 4, padding: '9px 12px', fontFamily: 'var(--font-body)',
                        fontSize: 14, color: 'var(--ink)', outline: 'none',
                      }}
                    />
                  </div>

                  {errors[permit.id] && (
                    <div style={{ fontSize: 13, color: '#c0392b', marginTop: 6, fontWeight: 500 }}>
                      {errors[permit.id]}
                    </div>
                  )}

                  <div className="draft-actions">
                    <button className="btn-skip" onClick={() => setExpanded(null)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Skip
                    </button>
                    <button
                      className="btn-send"
                      onClick={() => handleSend(permit.id)}
                      disabled={sending === permit.id}
                      style={{ opacity: sending === permit.id ? 0.6 : 1 }}
                    >
                      {sending === permit.id ? 'Sending…' : 'Send'}
                      {sending !== permit.id && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="draft-note">Sent from your Gmail · Can-SPAM compliant</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="feed-foot">
          {counts.all} permits loaded · refreshes every Monday at 6 AM
        </div>
      </div>
    </>
  )
}
