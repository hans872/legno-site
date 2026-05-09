'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetSetPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/permits')
    }
  }

  return (
    <>
      <header className="auth-topbar">
        <Link href="/" className="auth-mark">
          <span className="word">legno</span>
          <span className="dot" />
        </Link>
      </header>

      <main className="auth-shell narrow">
        <div className="auth-eyebrow">Almost there</div>
        <h1 className="auth-title">Set your <em>new password.</em></h1>
        <p className="auth-lede">Make it different from the last one. At least 8 characters.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label">New password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm new password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Type it again"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <div className="auth-hint">You&apos;ll be logged in once you save.</div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
            {!loading && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        </form>
      </main>
    </>
  )
}
