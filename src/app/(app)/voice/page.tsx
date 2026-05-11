'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type PermitType = 'ground-up' | 'adu' | 'remodel' | 'other'

type Template = {
  subject: string
  body: string
}

type Templates = Record<PermitType, Template>

const PERMIT_TYPES: { key: PermitType; label: string }[] = [
  { key: 'ground-up', label: 'Ground up' },
  { key: 'adu',       label: 'ADU' },
  { key: 'remodel',   label: 'Remodel' },
  { key: 'other',     label: 'Other' },
]

const DEFAULTS: Templates = {
  'ground-up': {
    subject: 'Blueprint takeoff · {{address}}',
    body: `Hi {{contractor_name}},

Came across the permit for {{address}} — a {{sqft}} ground-up project. We do blueprint takeoffs for new construction and full remodels across LA with a 48-hour turnaround.

Happy to send a sample takeoff at no charge. Worth a quick look?`,
  },
  adu: {
    subject: 'ADU takeoff · {{address}}',
    body: `Hi {{contractor_name}},

Noticed the ADU permit at {{address}}. We do ADU blueprint takeoffs daily and can turn around a complete materials estimate in 48 hours.

Want a free sample for this one?`,
  },
  remodel: {
    subject: 'Blueprint takeoff · {{address}}',
    body: `Hi {{contractor_name}},

Saw the permit for the remodel at {{address}}. We do blueprint takeoffs for additions and alterations across LA — 48-hour turnaround, first sample free.

Worth a quick look?`,
  },
  other: {
    subject: 'Blueprint services · {{address}}',
    body: `Hi {{contractor_name}},

Noticed your permit at {{address}}. We provide blueprint takeoffs and estimating services for LA contractors — 48-hour turnaround, first sample free.

Happy to send one over?`,
  },
}

const VARS = ['{{contractor_name}}', '{{address}}', '{{permit_number}}', '{{sqft}}', '{{valuation}}']

export default function VoicePage() {
  const supabase = createClient()
  const [active, setActive] = useState<PermitType>('ground-up')
  const [templates, setTemplates] = useState<Templates>(DEFAULTS)
  const [sig, setSig] = useState('')
  const [sample, setSample] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('voice_profiles')
        .select('templates, signature, writing_sample')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        if (data.templates && Object.keys(data.templates).length > 0) {
          setTemplates({ ...DEFAULTS, ...data.templates })
        }
        if (data.signature) setSig(data.signature)
        if (data.writing_sample) setSample(data.writing_sample)
      }
    }
    load()
  }, [])

  function updateTemplate(field: 'subject' | 'body', value: string) {
    setTemplates(t => ({ ...t, [active]: { ...t[active], [field]: value } }))
  }

  function insertVar(v: string) {
    const textarea = document.getElementById('tpl-body') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = templates[active].body
    const updated = current.slice(0, start) + v + current.slice(end)
    updateTemplate('body', updated)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + v.length, start + v.length)
    }, 0)
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('voice_profiles')
      .upsert({
        user_id: user.id,
        templates,
        signature: sig,
        writing_sample: sample,
        tone: 'warm',
      }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Templates</h1>
          <span className="topbar-meta">How Claude writes for you</span>
        </div>
      </div>

      <div className="app-page">

        {/* Template tabs */}
        <div className="app-section">
          <div className="app-section-title">Email templates</div>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 16px', lineHeight: 1.5 }}>
            One template per permit type. Use variables like <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>{'{{contractor_name}}'}</code> — they&apos;ll be filled in from the permit.
          </p>

          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {PERMIT_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  padding: '7px 16px',
                  border: '1px solid',
                  borderColor: active === key ? 'var(--ink)' : 'var(--border)',
                  borderRadius: 4,
                  background: active === key ? 'var(--ink)' : 'transparent',
                  color: active === key ? 'var(--paper)' : 'var(--ink-2)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="app-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 6 }}>
                Subject line
              </label>
              <input
                type="text"
                value={templates[active].subject}
                onChange={e => updateTemplate('subject', e.target.value)}
                style={{
                  width: '100%', border: '1px solid var(--border)', background: 'var(--surface-2)',
                  borderRadius: 4, padding: '10px 14px', fontFamily: 'var(--font-body)',
                  fontSize: 14, color: 'var(--ink)', outline: 'none',
                }}
              />
            </div>

            {/* Variable insert buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {VARS.map(v => (
                <button
                  key={v}
                  onClick={() => insertVar(v)}
                  style={{
                    padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 3,
                    background: 'var(--surface-2)', fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--ink-2)', cursor: 'pointer',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Body */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 6 }}>
                Email body
              </label>
              <textarea
                id="tpl-body"
                value={templates[active].body}
                onChange={e => updateTemplate('body', e.target.value)}
                style={{
                  width: '100%', border: '1px solid var(--border)', background: 'var(--surface-2)',
                  borderRadius: 4, padding: '12px 14px', fontFamily: 'var(--font-body)',
                  fontSize: 14, color: 'var(--ink)', outline: 'none', resize: 'vertical',
                  minHeight: 180, lineHeight: 1.6,
                }}
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="app-section">
          <div className="app-section-title">Email signature</div>
          <textarea
            style={{
              width: '100%', border: '1px solid var(--border)', background: 'var(--surface)',
              borderRadius: 4, padding: '12px 14px', fontFamily: 'var(--font-body)',
              fontSize: 14, color: 'var(--ink)', outline: 'none', resize: 'vertical',
              minHeight: 80, lineHeight: 1.6,
            }}
            placeholder={'— Ricardo\nGuzman Blueprint Estimating\n(310) 555-0182'}
            value={sig}
            onChange={e => setSig(e.target.value)}
          />
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>Appended to every email you send.</p>
        </div>

        {/* Writing sample fallback */}
        <div className="app-section">
          <div className="app-section-title">Writing sample <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>optional</span></div>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Paste a real email you&apos;ve sent. Claude uses it to match your style when no template is set.
          </p>
          <textarea
            style={{
              width: '100%', border: '1px solid var(--border)', background: 'var(--surface)',
              borderRadius: 4, padding: '12px 14px', fontFamily: 'var(--font-body)',
              fontSize: 14, color: 'var(--ink)', outline: 'none', resize: 'vertical',
              minHeight: 100, lineHeight: 1.6,
            }}
            placeholder="Hi Mike, thanks for reaching out. We do takeoffs for hillside projects across the Westside…"
            value={sample}
            onChange={e => setSample(e.target.value)}
          />
        </div>

        <button
          className="auth-btn"
          style={{ maxWidth: 200 }}
          onClick={save}
          disabled={saving}
        >
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save templates'}
          {!saving && !saved && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
