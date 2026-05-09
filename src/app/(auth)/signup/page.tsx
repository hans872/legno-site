'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '', lastName: '', company: '', website: '', email: '', password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          company: form.company,
          website: form.website,
        },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/verify?email=${encodeURIComponent(form.email)}`)
    }
  }

  return (
    <>
      <header className="auth-topbar">
        <Link href="/" className="auth-mark">
          <span className="word">legno</span>
          <span className="dot" />
        </Link>
        <Link href="/" className="auth-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
      </header>

      <main className="auth-shell">
        <div className="auth-eyebrow">Get started</div>
        <h1 className="auth-title">Create your <em>profile.</em></h1>
        <p className="auth-lede">Sign up to start landing leads from new construction permits in your area.</p>

        <div className="auth-form">
          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div>
              <label className="auth-label">Your name</label>
              <div className="auth-field-row">
                <input className="auth-input" type="text" placeholder="First name" autoComplete="given-name" required value={form.firstName} onChange={set('firstName')} />
                <input className="auth-input" type="text" placeholder="Last name" autoComplete="family-name" required value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Company name</label>
              <input className="auth-input" type="text" placeholder="Guzman Blueprint Estimating" autoComplete="organization" required value={form.company} onChange={set('company')} />
            </div>

            <div className="auth-field">
              <label className="auth-label">Company website <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-3)', fontWeight: 400, fontStyle: 'italic', fontFamily: 'var(--font-serif)', fontSize: '12px' }}>optional</span></label>
              <input className="auth-input" type="url" placeholder="guzmanblueprint.com" autoComplete="url" value={form.website} onChange={set('website')} />
              <div className="auth-hint">We&apos;ll use it to personalize your outreach and link contractors to your work.</div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Work email</label>
              <input className="auth-input" type="email" placeholder="ricardo@guzmanblueprint.com" autoComplete="email" required value={form.email} onChange={set('email')} />
              <div className="auth-hint">Use the address you send invoices and bids from.</div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className="auth-input" type="password" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required value={form.password} onChange={set('password')} />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
              {!loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </form>

          <div className="auth-link-row">
            Already have an account? <Link href="/login">Log in</Link>
          </div>
        </div>

        <p className="auth-foot">
          By continuing, you agree to our <a href="#">terms</a> and <a href="#">privacy policy</a>.<br />
          <strong>No card required to start.</strong>
        </p>
      </main>
    </>
  )
}
