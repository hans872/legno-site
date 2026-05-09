'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset/set`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <header className="auth-topbar">
        <Link href="/" className="auth-mark">
          <span className="word">legno</span>
          <span className="dot" />
        </Link>
        <Link href="/login" className="auth-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to log in
        </Link>
      </header>

      <main className="auth-shell narrow">
        {!sent ? (
          <>
            <div className="auth-eyebrow">Reset password</div>
            <h1 className="auth-title">Forgot it? <em>Happens.</em></h1>
            <p className="auth-lede">Enter your email and we&apos;ll send you a link to reset it.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="ricardo@guzmanblueprint.com"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              <div className="auth-link-row">
                Remembered it? <Link href="/login">Log in</Link>
              </div>
            </form>
          </>
        ) : (
          <div className="auth-form">
            <div className="sent-wrap">
              <div className="sent-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="sent-title">Check your email.</h2>
              <p className="sent-sub">We sent a reset link to:</p>
              <span className="sent-email">{email}</span>
              <p className="sent-sub" style={{ marginTop: 20, fontSize: 13 }}>
                The link expires in 1 hour. Don&apos;t see it? Check spam or{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setSent(false) }} style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  try again
                </a>.
              </p>
            </div>
            <div className="auth-link-row">
              <Link href="/login">Back to log in</Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
