'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

export default function AppShell({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const path = usePathname()
  const displayName = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ?? ''}`
    : user.email ?? 'You'

  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/permits" className="brand">
          <span className="word">legno</span>
          <span className="dot" />
        </Link>

        <div className="nav-section">
          <div className="nav-section-label">Today</div>
          <Link href="/permits" className={`nav-item${path === '/permits' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 L21 19 L3 19 Z" /><path d="M12 3 L12 19" />
            </svg>
            Permits
          </Link>
          <Link href="/inbox" className={`nav-item${path === '/inbox' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7l9 6 9-6" /><rect x="3" y="5" width="18" height="14" rx="1" />
            </svg>
            Inbox
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Setup</div>
          <Link href="/voice" className={`nav-item${path === '/voice' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Templates
          </Link>
          <Link href="/activity" className={`nav-item${path === '/activity' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="m7 14 3-3 4 4 5-5" />
            </svg>
            Activity
          </Link>
          <Link href="/settings" className={`nav-item${path === '/settings' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
            Settings
          </Link>
        </div>

        <div className="sidebar-spacer" />

        <div className="user-card">
          <div className="user-avatar">{initials(displayName)}</div>
          <div className="user-info">
            <div className="user-name">{displayName.trim()}</div>
            <div className="user-plan">Active</div>
          </div>
          <button className="user-menu-btn" aria-label="Account menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
