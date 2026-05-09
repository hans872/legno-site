import Link from 'next/link'

export default function ConnectGmailPage() {
  return (
    <>
      <header className="auth-topbar">
        <Link href="/" className="auth-mark">
          <span className="word">legno</span>
          <span className="dot" />
        </Link>
      </header>

      <main className="auth-shell">
        <div className="auth-eyebrow">Step 3 of 3</div>
        <h1 className="auth-title">Connect your <em>Gmail.</em></h1>
        <p className="auth-lede">
          Legno sends outreach <strong>from your actual Gmail address</strong> — not a third-party domain that lands in spam. This is how contractors trust your messages.
        </p>

        <div className="auth-form">
          <a href="/api/gmail/oauth" className="btn-gmail">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 22, height: 22, flexShrink: 0 }}>
              <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" fill="#fff" stroke="#DADCE0" strokeWidth="0.5" />
              <path d="M22 6l-10 7L2 6" stroke="#EA4335" strokeWidth="2" fill="none" />
              <path d="M2 6h2v12H2z" fill="#4285F4" />
              <path d="M20 6h2v12h-2z" fill="#34A853" />
              <path d="M2 6l10 7 10-7v2l-10 7L2 8z" fill="#FBBC05" />
            </svg>
            Continue with Gmail
          </a>
          <p className="gmail-note">
            You&apos;ll be redirected to <strong>Google</strong> · we never see your password
          </p>

          <div className="auth-perms">
            <div className="auth-perms-title">What Legno will do</div>
            <div className="perm-row">
              <div className="perm-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div><strong>Send emails on your behalf</strong> — only when you tap Send. We never send without you.</div>
            </div>
            <div className="perm-row">
              <div className="perm-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div><strong>Watch labeled threads for replies</strong> — only emails Legno sent. We never read your other mail.</div>
            </div>
            <div className="perm-row">
              <div className="perm-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div><strong>Disconnect anytime</strong> — revoke access in your Google account settings or in Legno settings.</div>
            </div>
          </div>
        </div>

        <div className="auth-explainer">
          <div className="auth-explainer-eye">Why your Gmail, not ours</div>
          <h3>Contractors trust <em>real people,</em> not platforms.</h3>
          <p>If outreach came from <strong>noreply@legno.com</strong>, it&apos;d land in spam and get ignored. Coming from <strong>your actual address</strong>, it lands in their primary inbox and reads like you wrote it on a coffee break. That&apos;s why this works.</p>
        </div>

        <div className="skip-row">
          Set up later? <Link href="/permits">Skip for now</Link>
        </div>
      </main>
    </>
  )
}
