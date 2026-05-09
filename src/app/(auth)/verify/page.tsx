import Link from 'next/link'

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  return (
    <VerifyContent searchParams={searchParams} />
  )
}

async function VerifyContent({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams

  return (
    <>
      <header className="auth-topbar">
        <Link href="/" className="auth-mark">
          <span className="word">legno</span>
          <span className="dot" />
        </Link>
      </header>

      <main className="auth-shell center">
        <div className="verify-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <div className="auth-eyebrow">Step 2 of 3</div>
        <h1 className="auth-title">Check your <em>email.</em></h1>
        <p className="auth-lede">We just sent a verification link to:</p>

        <div className="email-pill">{email ?? 'your email'}</div>

        <div className="auth-checklist">
          <div className="auth-checklist-title">What happens next</div>
          <div className="check-item">
            <span className="check-num">1</span>
            <div>Click the link in your email — it expires in 24 hours.</div>
          </div>
          <div className="check-item">
            <span className="check-num">2</span>
            <div>You&apos;ll connect Gmail so we can <strong>send outreach from your address.</strong></div>
          </div>
          <div className="check-item">
            <span className="check-num">3</span>
            <div>Today&apos;s permits will be waiting for you.</div>
          </div>
        </div>

        <p className="auth-foot">
          Don&apos;t see it? Check spam or <a href="#">resend the link</a>.
        </p>
      </main>
    </>
  )
}
