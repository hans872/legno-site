import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ?? ''}`.trim()
    : user?.email ?? ''

  return (
    <>
      <div className="app-topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Settings</h1>
        </div>
      </div>

      <div className="app-page">
        <div className="app-section">
          <div className="app-section-title">Account</div>
          <div className="app-card">
            <div className="app-row">
              <div className="app-row-label"><strong>Name</strong><span>{name}</span></div>
            </div>
            <div className="app-row">
              <div className="app-row-label"><strong>Email</strong><span>{user?.email}</span></div>
            </div>
            <div className="app-row">
              <div className="app-row-label"><strong>Password</strong><span>Change your password</span></div>
              <a href="/reset" style={{ padding: '8px 16px', border: '1px solid var(--border-strong)', borderRadius: 4, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}>
                Reset
              </a>
            </div>
          </div>
        </div>

        <div className="app-section">
          <div className="app-section-title">Gmail</div>
          <div className="app-card">
            <div className="app-row">
              <div className="app-row-label"><strong>Connected account</strong><span>Not connected</span></div>
              <a href="/api/gmail/oauth" style={{ padding: '8px 16px', border: '1px solid var(--border-strong)', borderRadius: 4, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Connect Gmail
              </a>
            </div>
          </div>
        </div>

        <div className="app-section">
          <div className="app-section-title">Preferences</div>
          <div className="app-card">
            <div className="app-row">
              <div className="app-row-label"><strong>Permit city</strong><span>Los Angeles (LADBS)</span></div>
            </div>
            <div className="app-row">
              <div className="app-row-label"><strong>Daily pull</strong><span>6:00 AM Pacific</span></div>
            </div>
          </div>
        </div>

        <form action={signOut}>
          <button type="submit" style={{ padding: '12px 20px', border: '1px solid var(--border-strong)', borderRadius: 4, background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--ink-2)' }}>
            Sign out
          </button>
        </form>
      </div>
    </>
  )
}
