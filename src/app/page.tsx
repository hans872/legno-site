'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import './landing.css'

export default function LandingPage() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const ArrowRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-mark">
          <span className="word">legno</span>
          <span className="dot" />
        </div>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why Legno</a>
          <a href="#pricing">Pricing</a>
          <Link href="/login" className="nav-cta">Log in</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-grid">
            <div>
              <div className="hero-eye">For blueprint estimators &amp; small builders</div>
              <h1 className="hero-headline">
                Stop <span className="strike">scrolling</span><br />
                permit portals.<br />
                <em>Start closing.</em>
              </h1>
              <p className="hero-sub">
                Legno watches every new construction permit in your city and drafts personalized outreach to the contractor.{' '}
                <strong>Free to start. No charge until you win your first lead.</strong>
              </p>
              <div className="hero-ctas">
                <Link href="/signup" className="btn-primary">
                  Start
                  <ArrowRight />
                </Link>
                <button
                  className="btn-ghost"
                  onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  See how it works
                </button>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="num">$0</div>
                  <div className="label">To sign up</div>
                </div>
                <div className="hero-stat">
                  <div className="num"><em>1st</em></div>
                  <div className="label">Reply on us</div>
                </div>
                <div className="hero-stat">
                  <div className="num">No</div>
                  <div className="label">Card required</div>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              {/* Card 1: New permit */}
              <div className="flow-card fc-1">
                <div className="fc-tag">
                  <span className="dotpulse" />
                  New permit · 4 min ago
                </div>
                <h3 className="fc-title">3,400 sqft single-family</h3>
                <div className="fc-meta">1247 N Crescent Heights Blvd</div>
                <div className="fc-row">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-2)' }}>LA-25-104782</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>$1.42M</span>
                </div>
              </div>

              {/* Card 2: Email drafted */}
              <div className="flow-card fc-2">
                <div className="fc-tag">
                  <span className="dotpulse" />
                  Draft · Claude
                </div>
                <div className="fc-body">
                  Hi <strong>Mr. Carillo</strong>, congrats on the permit at <strong>1247 N Crescent Heights Blvd</strong>. We do blueprint takeoffs for hillside SFRs across the Westside — typically a 48-hour turnaround on a 3,400 sqft scope.
                </div>
              </div>

              {/* Card 3: Reply received */}
              <div className="flow-card fc-3">
                <div className="fc-tag">
                  <span className="dotpulse dot-success" />
                  Reply received
                </div>
                <h3 className="fc-title">Carillo Bros.</h3>
                <div className="fc-body">&ldquo;Yes, please send the sample. We&apos;re starting framing in 3 weeks...&rdquo;</div>
                <div className="fc-row">
                  <span className="fc-bill-tag">qualified · billed</span>
                  <span className="fc-amount">+$50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-inner">
          <div className="section-eye">How it works</div>
          <h2 className="section-title">From <em>permit filed</em> to lead in your inbox.</h2>
          <p className="section-lede">No scrapers to maintain. No CRM to learn. Five steps run automatically every morning. You wake up to qualified replies.</p>

          <div className="flow">

            {/* Step 1 */}
            <div className="step reveal">
              <div className="step-num">i.</div>
              <div className="step-content">
                <h3>We watch the city, so you don&apos;t have to.</h3>
                <p>Every morning, Legno pulls the latest permits filed with LADBS — Los Angeles&apos; building department — directly from their public API. New filings, status changes, contractor info — captured the moment they post.</p>
                <p>We start with the <strong>City of Los Angeles</strong> via the LADBS public records API. More cities follow.</p>
                <div className="step-meta">
                  <span>LADBS API</span>
                  <span>Public records only</span>
                  <span>CSLB enriched</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="viz-feed-head">
                  <span>Permit feed · LADBS</span>
                  <span className="live">Live</span>
                </div>
                <div className="viz-permit-feed">
                  <div className="viz-feed-line new">
                    <span>LA-25-104782 · 1247 N Crescent Heights Blvd</span>
                    <span className="badge-new">NEW</span>
                  </div>
                  <div className="viz-feed-line new">
                    <span>LA-25-104779 · 2418 Beverwil Dr</span>
                    <span className="badge-new">NEW</span>
                  </div>
                  <div className="viz-feed-line">
                    <span>LA-25-104774 · 523 N Crescent Dr</span>
                    <span style={{ opacity: 0.5 }}>2h</span>
                  </div>
                  <div className="viz-feed-line">
                    <span>LA-25-104766 · 611 N Sycamore Ave</span>
                    <span style={{ opacity: 0.5 }}>5h</span>
                  </div>
                  <div className="viz-feed-line">
                    <span>LA-25-104761 · 1158 Kings Rd</span>
                    <span style={{ opacity: 0.5 }}>8h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step reveal">
              <div className="step-num">ii.</div>
              <div className="step-content">
                <h3>Claude writes the email. In your voice.</h3>
                <p>Each new permit gets a draft tailored to the project — square footage, foundation type, applicant name, contractor history. It reads like you wrote it on a coffee break.</p>
                <p>You see the draft, edit if you want, send with one tap. Or set rules to auto-send.</p>
                <div className="step-meta">
                  <span>Personalized per permit</span>
                  <span>Your tone &amp; sign-off</span>
                  <span>Editable in 2 sec</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="viz-draft">
                  <div className="viz-draft-label">
                    <span className="dot" />
                    Draft · Claude
                  </div>
                  <div className="viz-draft-body">
                    Hi <strong>Mr. Carillo</strong>, congrats on the permit at <strong>1247 N Crescent Heights Blvd</strong>. We do blueprint takeoffs for hillside SFRs across the Westside — typically a 48-hour turnaround on a 3,400 sqft scope like this one. Happy to send a sample takeoff if useful?
                    <br /><br />
                    — Ricardo<br />
                    <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>Guzman Blueprint Estimating</span>
                    <span className="typing" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step reveal">
              <div className="step-num">iii.</div>
              <div className="step-content">
                <h3>Sent from your real email. Tracked silently.</h3>
                <p>Legno connects to your existing Gmail. Every email goes from your real address — not a third-party domain that lands in spam. Recipients reply to you, not to us.</p>
                <p>Behind the scenes, we watch the thread for opens and replies, classify what comes back, and surface what matters.</p>
                <div className="step-meta">
                  <span>Sent via your Gmail</span>
                  <span>CAN-SPAM compliant</span>
                  <span>No email blasting</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="viz-send">
                  <div className="viz-send-row">
                    <span>To: carillo@carillobros.com</span>
                    <span className="ok">Delivered</span>
                  </div>
                  <div className="viz-send-row">
                    <span>Opened on iPhone · 7:42am</span>
                    <span className="ok">Read</span>
                  </div>
                  <div className="viz-send-meter">
                    <div>
                      <div className="meter-label">Sent this week</div>
                      <div className="meter-num">28</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="meter-label">Open rate</div>
                      <div className="meter-num"><em>61%</em></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="step reveal">
              <div className="step-num">iv.</div>
              <div className="step-content">
                <h3>When they reply, we flag it. Instantly.</h3>
                <p>Claude reads the reply and classifies it: <strong>interested</strong>, <strong>asking a question</strong>, <strong>not now</strong>, or <strong>auto-reply</strong>. Qualified ones rise to the top of your inbox with a push notification.</p>
                <p>You stay focused on the work. Legno does the watching.</p>
                <div className="step-meta">
                  <span>Real-time classification</span>
                  <span>Push notification</span>
                  <span>One-tap dispute</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="viz-reply">
                  <div className="viz-reply-head">
                    <span className="viz-reply-name">Carillo Bros.</span>
                    <span className="viz-reply-time">12 min ago</span>
                  </div>
                  <div className="viz-reply-body">
                    &ldquo;Yes please send the sample. We&apos;re starting framing in 3 weeks and could use a sanity check on the materials list — currently doing it ourselves...&rdquo;
                  </div>
                  <span className="viz-reply-tag">● Qualified · billed</span>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="step reveal">
              <div className="step-num">v.</div>
              <div className="step-content">
                <h3>Your first reply is on us.</h3>
                <p>Sign up free with Gmail. Browse every new permit in your city. Add a card when you&apos;re ready to send your first email — we&apos;ll hold the spot for your free first reply.</p>
                <p>After that, $50 per qualified reply — only when a real contractor actually writes back. No subscription. No per-email fee. Out-of-office and &ldquo;no thanks&rdquo; never count.</p>
                <div className="step-meta">
                  <span>No charge until you win</span>
                  <span>30-day dispute window</span>
                  <span>Cancel anytime</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="viz-send">
                  <div className="viz-send-row">
                    <span>Reply · Carillo Bros.</span>
                    <span className="ok">Qualified</span>
                  </div>
                  <div className="viz-send-row">
                    <span>Standard rate</span>
                    <span className="strike-rate">$50</span>
                  </div>
                  <div className="viz-send-meter">
                    <div>
                      <div className="meter-label">Your first reply</div>
                      <div className="meter-num"><em>on us</em></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="meter-label">You pay today</div>
                      <div className="meter-num">$0</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* WHY LEGNO */}
      <section className="section" id="why" style={{ background: 'var(--bg-warm)' }}>
        <div className="section-inner">
          <div className="section-eye">Why Legno</div>
          <h2 className="section-title">Built for the people <em>who actually do the work.</em></h2>
          <p className="section-lede">Legno is for blueprint estimators, ADU specialists, framing crews, and small GCs — the ones who lose hours every week scrolling permit portals before they can pick up a tool. We give that time back.</p>

          <div className="why-grid">
            <div className="why-card">
              <div className="why-num">// 01</div>
              <h4>No charge until you win.</h4>
              <p>Sign up free. Card on file when you start sending — but no money moves until a real contractor writes back. Your first reply is on us.</p>
            </div>
            <div className="why-card">
              <div className="why-num">// 02</div>
              <h4>Real Gmail. Real you.</h4>
              <p>Emails come from your address — not a third-party domain that lands in spam. Recipients see your name, your sign-off, your business.</p>
            </div>
            <div className="why-card">
              <div className="why-num">// 03</div>
              <h4>One-tap workflow.</h4>
              <p>Wake up to drafts. Skip what doesn&apos;t fit. Send what does. Done in under five minutes a day, on your phone, in the truck.</p>
            </div>
            <div className="why-card">
              <div className="why-num">// 04</div>
              <h4>You own the relationship.</h4>
              <p>Replies go to your inbox, not ours. We&apos;re the introduction — you&apos;re the business. Take the conversation anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section pricing-section" id="pricing">
        <div className="section-inner">
          <div className="section-eye">Pricing</div>
          <h2 className="section-title">Free <em>to start.</em><br />No charge <em>until you win.</em></h2>
          <p className="section-lede">No subscription. No per-email fee. We hold a card on file when you start sending — but nothing&apos;s charged until a real contractor writes back. And your first one is on us.</p>

          <div className="price-wedge">
            <div className="wedge-step">
              <div className="wedge-num">$0</div>
              <div className="wedge-label">to sign up</div>
              <div className="wedge-note">Connect Gmail. Get every new permit in your area. Browse free.</div>
            </div>
            <div className="wedge-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </div>
            <div className="wedge-step">
              <div className="wedge-num">$0</div>
              <div className="wedge-label">until first reply</div>
              <div className="wedge-note">Add a card when you send your first email. Nothing&apos;s charged until a contractor writes back — and your first one is on us.</div>
            </div>
            <div className="wedge-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </div>
            <div className="wedge-step featured">
              <div className="wedge-num">$50</div>
              <div className="wedge-label">per qualified reply</div>
              <div className="wedge-note">Only when a real contractor writes back. Out-of-office and &ldquo;no thanks&rdquo; never count.</div>
            </div>
          </div>

          <div className="price-cta-wrap">
            <Link href="/signup" className="price-cta-solo">
              Start
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="price-fineprint">
            <strong>No subscription</strong> · One-tap dispute &amp; auto-credit · Cancel anytime
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section">
        <div className="section-inner">
          <p className="cta-quote">
            &ldquo;I used to spend Sunday nights scrolling the city portal with a notepad.<br />
            <span className="accent">Now I drink coffee on my porch and tap &lsquo;send.&rsquo;&rdquo;</span>
          </p>
          <div className="cta-attrib">— Ricardo G., Guzman Blueprint Estimating</div>

          <Link href="/signup" className="cta-final">
            Start
            <ArrowRight />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-mark">
            <span className="word">legno</span>
            <span className="dot" />
          </div>
          <div className="footer-meta">
            Permits, framed · Made in Los Angeles · © 2026
          </div>
        </div>
      </footer>
    </>
  )
}
