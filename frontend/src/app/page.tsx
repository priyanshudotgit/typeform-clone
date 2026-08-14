"use client";

import Link from "next/link";
import { useState } from "react";

/* ────────────────────────────────────────────────────────────
   Typeform.com Landing Page — Same-to-same clone
   ──────────────────────────────────────────────────────────── */

/* ── INLINE SVG LOGO (matches Typeform's actual logomark) ── */
function TypeformLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="6" fill="#191919" />
      <path
        d="M7 8h10M12 8v8"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── NAVBAR ─────────────────────────────────────────────────── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <TypeformLogo />
        typeform
      </Link>

      <ul className="navbar-nav">
        <li>
          <a href="#product">Product</a>
        </li>
        <li>
          <a href="#features">Features</a>
        </li>
        <li>
          <a href="#templates">Templates</a>
        </li>
        <li>
          <a href="#pricing">Pricing</a>
        </li>
        <li>
          <a href="#">Enterprise</a>
        </li>
      </ul>

      <div className="navbar-actions">
        <Link href="/login" className="btn-ghost">
          Log in
        </Link>
        <Link href="/login" className="btn-primary">
          Get started free
        </Link>
      </div>
    </nav>
  );
}

/* ── HERO ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero">
      {/* Decorative background blobs */}
      <div className="hero-blob hero-blob-1" aria-hidden="true" />
      <div className="hero-blob hero-blob-2" aria-hidden="true" />

      <div className="hero-content">
        <h1 className="animate-fadein">
          Turn questions into
          <br />
          conversations
        </h1>
        <p className="hero-subtitle animate-fadein-delay-1">
          Collect data, grow your business. Typeform makes asking easy and
          answering fun, whether it&apos;s questions, quizzes, or apps.
        </p>
        <div className="hero-cta-group animate-fadein-delay-2">
          <Link href="/login" className="btn-primary btn-primary-large">
            Sign up for free
          </Link>
          <span className="hero-note">No credit card required</span>
        </div>

        {/* Form preview card */}
        <div className="hero-form-preview animate-fadein-delay-3">
          <div className="form-preview-bar">
            <div
              className="form-preview-dot"
              style={{ background: "#ff5f57" }}
            />
            <div
              className="form-preview-dot"
              style={{ background: "#ffbd2e" }}
            />
            <div
              className="form-preview-dot"
              style={{ background: "#28ca41" }}
            />
            <div
              style={{
                marginLeft: "auto",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Customer Feedback Survey
            </div>
          </div>
          <div className="form-preview-body">
            <p className="form-preview-question">
              <span>1 →</span> How satisfied are you with our product?
            </p>
            <div className="form-preview-options">
              {[
                { key: "A", label: "Very satisfied 😄", selected: false },
                { key: "B", label: "Satisfied 🙂", selected: true },
                { key: "C", label: "Neutral 😐", selected: false },
                { key: "D", label: "Not satisfied 😕", selected: false },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className={`form-option ${opt.selected ? "selected" : ""}`}
                >
                  <span className="form-option-key">{opt.key}</span>
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── LOGOS STRIP ─────────────────────────────────────────────── */
const logos = [
  { name: "Airbnb", style: { fontStyle: "italic" } },
  { name: "Uber", style: {} },
  { name: "Nike", style: { fontStyle: "italic", letterSpacing: "-1px" } },
  { name: "Mailchimp", style: {} },
  { name: "HubSpot", style: {} },
  { name: "Slack", style: {} },
];

function LogosStrip() {
  return (
    <section className="logos-section">
      <p className="logos-label">Trusted by 150,000+ businesses worldwide</p>
      <div className="logos-grid">
        {logos.map((logo) => (
          <span key={logo.name} className="logo-item" style={logo.style}>
            {logo.name}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── FEATURES ────────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" className="features-section">
      {/* Feature 1 — Engage your audience */}
      <div className="feature-grid" style={{ marginBottom: "6rem" }}>
        <div className="feature-text">
          <p className="section-label">👀 Engage</p>
          <h2 className="section-title">Engage your audience like never before</h2>
          <p className="section-desc">
            Create conversational forms, surveys, and quizzes that people enjoy
            answering. Use logic jumps, beautiful layouts, and interactive
            elements to collect better data.
          </p>
          <div className="feature-badges">
            <span className="feature-badge">📋 Logic jumps</span>
            <span className="feature-badge">🎨 Beautiful themes</span>
            <span className="feature-badge">📱 Mobile-first</span>
          </div>
        </div>
        <div className="feature-visual">
          <div className="mock-form" style={{ maxWidth: 320 }}>
            <div className="mock-form-header">
              <span className="mock-form-title">Customer Survey</span>
              <span className="mock-progress">2 / 5</span>
            </div>
            <p className="mock-question">What&apos;s your biggest challenge at work?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {["Time management", "Team collaboration", "Unclear priorities", "Too many meetings"].map(
                (opt, i) => (
                  <div
                    key={opt}
                    className={`form-option ${i === 1 ? "selected" : ""}`}
                    style={{ fontSize: "0.82rem" }}
                  >
                    <span className="form-option-key">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    {opt}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2 — Analyze responses */}
      <div
        className="feature-grid reverse"
        style={{ marginBottom: "6rem" }}
      >
        <div className="feature-text">
          <p className="section-label">📊 Analyze</p>
          <h2 className="section-title">Turn responses into insights instantly</h2>
          <p className="section-desc">
            Get real-time analytics with completion rates, drop-off points, and
            response breakdowns. Export to Google Sheets, Notion, or Slack with
            one click.
          </p>
          <div className="feature-badges">
            <span className="feature-badge">📈 Real-time stats</span>
            <span className="feature-badge">🔗 300+ integrations</span>
            <span className="feature-badge">📤 Easy export</span>
          </div>
        </div>
        <div className="feature-visual">
          <div className="mock-analytics" style={{ width: "100%" }}>
            <div className="mock-stat">
              <div
                className="mock-stat-icon"
                style={{ background: "#f0f7ff", fontSize: "1.2rem" }}
              >
                📬
              </div>
              <div>
                <div className="mock-stat-val">2,847</div>
                <div className="mock-stat-label">Total responses</div>
              </div>
            </div>
            <div className="mock-stat">
              <div
                className="mock-stat-icon"
                style={{ background: "#f0fff4" }}
              >
                ✅
              </div>
              <div>
                <div className="mock-stat-val">73%</div>
                <div className="mock-stat-label">Completion rate</div>
              </div>
            </div>
            <div className="mock-bar-chart">
              <div style={{ marginBottom: "0.75rem", fontWeight: 700, fontSize: "0.8rem", color: "#191919" }}>
                Top answers
              </div>
              {[
                { label: "Option A", pct: 42 },
                { label: "Option B", pct: 31 },
                { label: "Option C", pct: 17 },
                { label: "Option D", pct: 10 },
              ].map((bar) => (
                <div className="bar-row" key={bar.label}>
                  <span className="bar-label">{bar.label}</span>
                  <div
                    className="bar-fill"
                    style={{ width: `${bar.pct}%`, flex: 1 }}
                  />
                  <span className="bar-pct">{bar.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature 3 — Build fast with AI */}
      <div className="feature-grid">
        <div className="feature-text">
          <p className="section-label">✨ AI-powered</p>
          <h2 className="section-title">Build any form in seconds with AI</h2>
          <p className="section-desc">
            Describe what you need and watch your form build itself. Our AI
            generates questions, logic, and design — you just tweak and publish.
          </p>
          <div className="feature-badges">
            <span className="feature-badge">🤖 AI builder</span>
            <span className="feature-badge">⚡ Instant generation</span>
            <span className="feature-badge">🎯 Smart questions</span>
          </div>
        </div>
        <div className="feature-visual">
          <div className="mock-form" style={{ maxWidth: 320 }}>
            <div className="mock-form-header">
              <span className="mock-form-title">✨ AI Builder</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  background: "#191919",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: "100px",
                }}
              >
                Beta
              </span>
            </div>
            <p className="mock-question" style={{ fontSize: "0.85rem", color: "#6b6b6b" }}>
              What would you like to build?
            </p>
            <div
              className="mock-input"
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1.5px solid #191919",
                background: "#fff",
                color: "#191919",
                marginBottom: "0.75rem",
              }}
            >
              A product feedback survey for SaaS...
            </div>
            <div
              style={{
                padding: "0.75rem",
                background: "#f7f5f2",
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: "#6b6b6b",
                marginBottom: "0.75rem",
              }}
            >
              🤖 Generating 8 questions with logic jumps and a thank-you screen...
            </div>
            <button className="mock-btn" style={{ width: "100%" }}>
              Generate form →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── STATS ───────────────────────────────────────────────────── */
function Stats() {
  return (
    <section className="stats-section">
      <div className="stats-grid">
        <div>
          <div className="stat-number">150K+</div>
          <div className="stat-label">Businesses use Typeform</div>
        </div>
        <div>
          <div className="stat-number">500M</div>
          <div className="stat-label">Responses collected</div>
        </div>
        <div>
          <div className="stat-number">3×</div>
          <div className="stat-label">Higher completion rate than traditional forms</div>
        </div>
      </div>
    </section>
  );
}

/* ── TEMPLATES ───────────────────────────────────────────────── */
const templates = [
  {
    tag: "Feedback",
    name: "Customer Satisfaction Survey",
    emoji: "⭐",
    bg: "#fff8e6",
  },
  {
    tag: "Lead Generation",
    name: "Contact & Lead Capture Form",
    emoji: "📬",
    bg: "#f0f7ff",
  },
  {
    tag: "Quiz",
    name: "Product Knowledge Quiz",
    emoji: "🧠",
    bg: "#f5f0ff",
  },
  {
    tag: "Research",
    name: "Market Research Survey",
    emoji: "🔍",
    bg: "#f0fff4",
  },
  {
    tag: "HR",
    name: "Employee Engagement Survey",
    emoji: "💼",
    bg: "#fff0f0",
  },
  {
    tag: "Events",
    name: "Event Registration Form",
    emoji: "🎉",
    bg: "#f7f5f2",
  },
];

function Templates() {
  return (
    <section id="templates" className="templates-section">
      <div className="templates-header">
        <p className="section-label">Templates</p>
        <h2 className="section-title">Start with a ready-made form</h2>
        <p className="section-desc" style={{ margin: "0 auto" }}>
          Hundreds of templates for every use case. Customise in minutes, publish in seconds.
        </p>
      </div>
      <div className="templates-grid">
        {templates.map((t) => (
          <a key={t.name} href="/login" className="template-card">
            <div className="template-thumb" style={{ background: t.bg }}>
              <span style={{ fontSize: "3rem" }}>{t.emoji}</span>
            </div>
            <div className="template-info">
              <div className="template-tag">{t.tag}</div>
              <div className="template-name">{t.name}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ────────────────────────────────────────────── */
const testimonials = [
  {
    quote:
      '"Typeform completely transformed how we collect customer feedback. Our completion rates went from 20% to over 70% — it&apos;s incredible."',
    name: "Sarah Chen",
    role: "Head of CX @ Notion",
    initials: "SC",
    bg: "#4f46e5",
  },
  {
    quote:
      '"The one-question-at-a-time format is genius. People actually enjoy filling out our forms now, and our data quality has never been better."',
    name: "Marcus Rodriguez",
    role: "Growth Lead @ Stripe",
    initials: "MR",
    bg: "#0ea5e9",
  },
  {
    quote:
      '"We use Typeform for everything — onboarding, NPS, research. The integrations with Slack and Notion save us hours every week."',
    name: "Priya Sharma",
    role: "Product Manager @ Figma",
    initials: "PS",
    bg: "#10b981",
  },
];

function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="testimonials-inner">
        <p className="section-label">What people say</p>
        <h2 className="section-title">Loved by teams everywhere</h2>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card">
              <p className="testimonial-quote">{t.quote}</p>
              <div className="testimonial-author">
                <div
                  className="testimonial-avatar"
                  style={{ background: t.bg }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA SECTION ─────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="cta-section">
      <p className="section-label" style={{ textAlign: "center" }}>
        Get started
      </p>
      <h2 className="section-title">
        Start asking better
        <br />
        questions today
      </h2>
      <p className="section-desc">
        Join 150,000 businesses using Typeform to collect better data and build
        better relationships.
      </p>
      <div className="cta-actions">
        <Link href="/login" className="btn-primary btn-primary-large">
          Sign up for free
        </Link>
        <a href="#features" className="btn-secondary">
          See how it works
        </a>
      </div>
    </section>
  );
}

/* ── FOOTER ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="navbar-logo" style={{ marginBottom: "0.5rem" }}>
            <TypeformLogo />
            typeform
          </Link>
          <p>Make forms people love to fill out.</p>
        </div>
        {[
          {
            title: "Product",
            links: ["Form Builder", "Features", "Templates", "Integrations", "What&apos;s new"],
          },
          {
            title: "Solutions",
            links: ["Marketing", "Customer Success", "HR", "Research", "Enterprise"],
          },
          {
            title: "Resources",
            links: ["Blog", "Help center", "Guides", "Community", "Webinars"],
          },
          {
            title: "Company",
            links: ["About us", "Careers", "Press", "Partners", "Contact"],
          },
        ].map((col) => (
          <div key={col.title} className="footer-col">
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((link) => (
                <li key={link}>
                  <a href="/login" dangerouslySetInnerHTML={{ __html: link }} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p>© 2024 Typeform SL. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}

/* ── PAGE EXPORT ─────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      <Navbar />
      <main>
        <Hero />
        <LogosStrip />
        <Features />
        <Stats />
        <Templates />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
