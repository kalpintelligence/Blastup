'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowRight, ChevronDown, Check, Terminal, ExternalLink, Github } from 'lucide-react';

const coreFeatures = [
  {
    title: 'Unlimited Campaigns',
    subtitle: 'Broadcast without per-message fees',
    description: 'Send bulk updates, announcements, and product carousels to your entire contact list. Connects directly to WhatsApp web sockets with zero per-conversation Meta charges.',
  },
  {
    title: 'Visual Flow Chatbot',
    subtitle: 'Automate replies and capture leads 24/7',
    description: 'Design conversational journeys with reply buttons, keyword matching, and lead forms in a visual builder. Test flows in real-time with the built-in mobile simulator.',
  },
  {
    title: 'Anti-Ban Protection',
    subtitle: 'SafeMode delay pacing and warmup',
    description: 'Intelligent randomized delays, batch segmentation, and warmup routines ensure your numbers stay safe and behave naturally.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Connect WhatsApp',
    description: 'Scan a QR code from your phone using WhatsApp Multi-Device. No Meta approval delays or business verification needed.',
  },
  {
    step: '02',
    title: 'Set up flow or campaign',
    description: 'Import your contacts via CSV, segment by groups, or build an interactive chatbot flow with custom trigger keywords.',
  },
  {
    step: '03',
    title: 'Launch and track',
    description: 'Send broadcasts with automatic delay throttling. Monitor delivery, read receipts, and replies in real time.',
  },
];

const comparison = [
  { feature: 'Cost per 100k messages', blastup: '$0 (Free forever)', cloudApi: '$500 – $1,200 / mo' },
  { feature: 'Template approval wait', blastup: 'None (Instant)', cloudApi: '24–48 hours' },
  { feature: 'Hosting & privacy', blastup: 'Self-hosted on your server', cloudApi: 'Third-party cloud' },
  { feature: 'No-code chatbot', blastup: 'Included', cloudApi: 'Paid add-on' },
  { feature: 'License', blastup: 'MIT Open Source', cloudApi: 'Proprietary' },
];

const faqs = [
  {
    q: 'Is Blastup genuinely free?',
    a: 'Yes. Blastup is released under the MIT Open Source License. You can run it on your own server or VPS at zero software cost. There are no monthly subscriptions and no paywalls.',
  },
  {
    q: 'How does it connect to WhatsApp?',
    a: 'Blastup uses the Baileys multi-device protocol. You link your phone by scanning a QR code once, exactly like WhatsApp Web. It runs standalone on your server without requiring Meta Cloud API verification.',
  },
  {
    q: 'Will my WhatsApp number get blocked?',
    a: 'Blastup includes a built-in SafeMode engine that paces message delivery with randomized delays, rotates message templates, and manages hourly volume limits to protect your account.',
  },
  {
    q: 'What are the server requirements to self-host?',
    a: 'A simple $5–$10/mo VPS (e.g. 1 vCPU, 2GB RAM on Hetzner, DigitalOcean, or AWS) running Docker and Docker Compose is more than enough for thousands of daily messages.',
  },
  {
    q: 'Can I integrate with my existing backend or CRM?',
    a: 'Yes. Blastup provides a complete REST API with API keys. You can trigger OTPs, order updates, and custom notifications via simple HTTP POST requests.',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyDockerCommand = () => {
    navigator.clipboard.writeText('git clone https://github.com/kalpintelligence/blastup.git\ncd blastup\ndocker compose up -d');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      background: '#FFFFFF',
      color: '#0F172A',
      minHeight: '100vh',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .hero-btn-primary {
          background: #0F172A;
          color: #ffffff;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 500;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .hero-btn-primary:hover {
          background: #1e293b;
        }

        .hero-btn-secondary {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 18px;
          font-weight: 500;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .hero-btn-secondary:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .dash-container {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07);
          overflow: hidden;
          background: #ffffff;
        }

        .card-minimal {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 28px;
          background: #ffffff;
          transition: border-color 0.2s ease;
        }
        .card-minimal:hover {
          border-color: #cbd5e1;
        }
      `}</style>

      {/* Shared Navbar */}
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        maxWidth: 1040,
        margin: '0 auto',
        paddingTop: 130,
        paddingBottom: 60,
        paddingLeft: 24,
        paddingRight: 24,
      }}>
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: '#16a34a',
            marginBottom: 16,
            letterSpacing: '0.02em',
          }}>
            <span>●</span> Open Source WhatsApp Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            marginBottom: 16,
          }}>
            Broadcast campaigns and build chatbots on WhatsApp. Free &amp; self-hosted.
          </h1>

          <p style={{
            fontSize: 16,
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: 28,
            maxWidth: 580,
          }}>
            Blastup gives you unlimited WhatsApp broadcasts, no-code chatflows, and anti-ban protection without Meta per-message fees.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="hero-btn-primary">
              Open Dashboard <ArrowRight size={14} />
            </Link>
            <Link href="/chatbot" className="hero-btn-secondary">
              Try Chatbot
            </Link>
            <Link href="/deploy" className="hero-btn-secondary">
              Deploy Guide
            </Link>
          </div>
        </div>

        {/* ── DASHBOARD SHOWCASE ── */}
        <div className="dash-container">
          <div style={{
            height: 36,
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: 6,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e2e8f0' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e2e8f0' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e2e8f0' }} />
            <div style={{ marginLeft: 8, fontSize: 12, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#16a34a', fontSize: 11 }}>🔒</span> wa.kalp.ltd/dashboard
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard.png"
            alt="Blastup Dashboard — wa.kalp.ltd"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </section>

      {/* ── 3 CORE FEATURES ── */}
      <section id="features" style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
            Core capabilities
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Built for developers, marketers, and businesses who want direct control over their WhatsApp communication.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {coreFeatures.map((item) => (
            <div key={item.title} className="card-minimal">
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 12 }}>
                {item.subtitle}
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NO-CODE CHATBOT FEATURE SPOTLIGHT ── */}
      <section style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '36px 32px',
          background: '#fafaf9',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#16a34a',
              marginBottom: 10,
              letterSpacing: '0.02em',
            }}>
              ● NO-CODE VISUAL CHATBOT
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Build automated conversational flows in minutes
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
              The <strong>No-Code Chatbot Flow Engine</strong> allows you to visually connect welcome triggers, interactive button menus, catalog drops, order lookups, and human agent interventions without writing a line of code.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span><strong>Keyword Triggers:</strong> Automatically trigger replies when customers say &quot;Hi&quot;, &quot;Order&quot;, &quot;Pricing&quot;, or &quot;Help&quot;.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span><strong>Interactive Buttons:</strong> Native 1-tap WhatsApp reply buttons that drive instant click-through rates.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span><strong>Live Phone Simulator:</strong> Test the full conversational experience before deploying to your WhatsApp number.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/chatbot/no-code" className="hero-btn-primary">
                Open No-Code Chatbot <ArrowRight size={14} />
              </Link>
              <Link href="/chatbot" className="hero-btn-secondary">
                Chatbot Settings
              </Link>
            </div>
          </div>

          {/* Minimal Flow Preview Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              Live Journey Preview
            </div>

            {/* Node 1 */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>01 / Trigger</div>
              <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500, marginTop: 2 }}>Keyword: &quot;Hi&quot; or &quot;Urban Studioz&quot;</div>
            </div>

            {/* Node 2 */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>02 / Media + Buttons</div>
              <div style={{ fontSize: 12, color: '#0f172a', marginTop: 2 }}>&quot;Welcome to Urban Studioz 👋 How can we help?&quot;</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '3px 8px', background: '#ffffff', border: '1px solid #86efac', borderRadius: 4, color: '#16a34a', fontWeight: 600 }}>🛍️ Shop Now</span>
                <span style={{ fontSize: 11, padding: '3px 8px', background: '#ffffff', border: '1px solid #86efac', borderRadius: 4, color: '#16a34a', fontWeight: 600 }}>📦 Track Order</span>
                <span style={{ fontSize: 11, padding: '3px 8px', background: '#ffffff', border: '1px solid #86efac', borderRadius: 4, color: '#16a34a', fontWeight: 600 }}>💬 Live Agent</span>
              </div>
            </div>

            {/* Node 3 */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb' }}>03 / Action &amp; Routing</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Instant order lookup or human specialist takeover</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (3 STEPS) ── */}
      <section style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
            How it works
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Get started in minutes without waiting for Meta API approvals.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {steps.map((s) => (
            <div key={s.step} style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 8, fontFamily: 'monospace' }}>
                {s.step}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SELF-HOST / TERMINAL BOX ── */}
      <section style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{
          background: '#0F172A',
          borderRadius: 12,
          padding: '32px 28px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 6 }}>
              Quick Self-Host
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Run with Docker in under a minute
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
              Clone the repository and spin up both the client, server, and MongoDB instances using Docker Compose.
            </p>
          </div>

          <div style={{
            background: '#020617',
            borderRadius: 8,
            padding: '16px 20px',
            border: '1px solid #1e293b',
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#e2e8f0',
            position: 'relative',
            minWidth: 280,
          }}>
            <div style={{ color: '#64748b', marginBottom: 4 }}># Clone and start</div>
            <div>git clone https://github.com/kalpintelligence/blastup.git</div>
            <div>cd blastup</div>
            <div style={{ color: '#4ade80' }}>docker compose up -d</div>

            <button
              onClick={copyDockerCommand}
              style={{
                marginTop: 12,
                background: '#1e293b',
                color: '#f8fafc',
                border: 'none',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {copiedCode ? '✓ Copied' : 'Copy commands'}
            </button>
          </div>
        </div>
      </section>

      {/* ── SIMPLE COMPARISON TABLE ── */}
      <section style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
            Blastup vs Meta Cloud API
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Feature</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, color: '#16a34a' }}>Blastup</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Meta Cloud API</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: '#0f172a' }}>{row.feature}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#16a34a' }}>{row.blastup}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{row.cloudApi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
            Questions &amp; answers
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                      color: '#64748b',
                    }}
                  />
                </button>

                {isOpen && (
                  <div style={{ padding: '0 18px 16px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MINIMAL CTA ── */}
      <section style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '60px 24px 80px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Ready to send your first campaign?
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
              Open the dashboard or deploy Blastup on your own server.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/dashboard" className="hero-btn-primary">
              Launch Dashboard
            </Link>
            <a
              href="https://github.com/kalpintelligence/blastup"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn-secondary"
            >
              <Github size={14} /> Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
