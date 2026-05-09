'use client'

import { useState } from 'react'

export default function VoicePage() {
  const [tone, setTone] = useState<'warm' | 'direct' | 'formal'>('warm')
  const [sample, setSample] = useState('')
  const [sig, setSig] = useState('')

  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Voice &amp; templates</h1>
          <span className="topbar-meta">How Claude writes for you</span>
        </div>
      </div>

      <div className="app-page">
        <div className="app-section">
          <div className="app-section-title">Tone</div>
          <div className="app-card" style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(['warm', 'direct', 'formal'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                style={{
                  flex: 1, minWidth: 120,
                  padding: '16px 12px', border: '1px solid',
                  borderColor: tone === t ? 'var(--ink)' : 'var(--border)',
                  borderRadius: 4, background: tone === t ? 'var(--ink)' : 'transparent',
                  color: tone === t ? 'var(--paper)' : 'var(--ink-2)',
                  cursor: 'pointer', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em',
                  transition: 'all 0.12s', textAlign: 'center',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, marginTop: 4, opacity: 0.7 }}>
                  {t === 'warm' ? 'Friendly, human' : t === 'direct' ? 'Short, no fluff' : 'Professional'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="app-section">
          <div className="app-section-title">Writing sample</div>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 12px' }}>Paste a real email you&apos;ve sent to a contractor. Claude uses it to match your voice.</p>
          <textarea
            className="auth-input"
            style={{ minHeight: 120, resize: 'vertical', lineHeight: 1.55, fontFamily: 'var(--font-body)' }}
            placeholder="Hi Mike, thanks for reaching out. We do takeoffs for hillside projects across the Westside…"
            value={sample}
            onChange={e => setSample(e.target.value)}
          />
        </div>

        <div className="app-section">
          <div className="app-section-title">Email signature</div>
          <textarea
            className="auth-input"
            style={{ minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-body)' }}
            placeholder={"— Ricardo\nGuzman Blueprint Estimating\n(310) 555-0182"}
            value={sig}
            onChange={e => setSig(e.target.value)}
          />
        </div>

        <button
          className="auth-btn"
          style={{ maxWidth: 240 }}
          onClick={() => alert('Voice profile saved!')}
        >
          Save voice profile
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </>
  )
}
