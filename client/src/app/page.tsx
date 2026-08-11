'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Send, Users, Megaphone, Bot, Zap, BarChart3,
  ShieldCheck, CheckCircle, ArrowRight, Globe, Sparkles, Cpu,
  Layers, RefreshCw, FileText, Lock, CheckCheck,
  TrendingUp, Wifi, Key, LogOut, LayoutDashboard, Info,
  Sliders, HelpCircle, ChevronDown, Check, X
} from 'lucide-react';

const featureCards = [
  {
    tag: 'BULK BROADCASTS',
    icon: Megaphone,
    title: 'High-Volume Campaign Engine',
    desc: 'Broadcast personalized messages to millions of contacts with automated group segmenting, instant scheduling, and sub-second delivery tracking.',
    statVal: '2,800,000+',
    statLabel: 'Messages Delivered',
    accent: '#33D951',
  },
  {
    tag: 'AUTO-RESPONDER',
    icon: Bot,
    title: 'AI Chatbot & Flow Engine',
    desc: 'Configure keyword triggers and automated interactive flows. Your WhatsApp business responds to incoming leads 24/7 with zero human delay.',
    statVal: '99.8%',
    statLabel: 'Response Rate',
    accent: '#6366f1',
  },
  {
    tag: 'LIVE MESSAGING',
    icon: MessageSquare,
    title: 'Unified Team Inbox',
    desc: 'Centralized Web console to view, manage, and assign all incoming WhatsApp conversations in real time with zero phone dependencies.',
    statVal: '100%',
    statLabel: 'Uptime SLA Guarantee',
    accent: '#06b6d4',
  },
];

const integrations = [
  { name: 'WhatsApp Web Socket', icon: Wifi, color: '#33D951' },
  { name: 'REST Webhooks API', icon: Zap, color: '#6366f1' },
  { name: 'CSV Contact Import', icon: FileText, color: '#3b82f6' },
  { name: 'AI Rule Engine', icon: Bot, color: '#f59e0b' },
  { name: 'API Key Security', icon: Key, color: '#ec4899' },
];

const comparisonData = [
  { feature: 'Average Open Rate', whatsapp: '98% (Within 5 mins)', email: '20% (Often spam)', sms: '45% (Ignored)' },
  { feature: 'Delivery Speed', whatsapp: 'Sub-second Instant', email: '15-45 minutes', sms: 'Variable queue' },
  { feature: 'Interactive CTAs & Sliders', whatsapp: 'Yes (Native Buttons)', email: 'Static HTML', sms: 'Plain text only' },
  { feature: 'AI Auto-Responder', whatsapp: 'Built-in 24/7 Bot', email: 'Auto-reply text', sms: 'Not supported' },
  { feature: 'Contact Grouping & Import', whatsapp: 'Unlimited Tags & CSV', email: 'Complex CRM', sms: 'Manual lists' },
];

const faqs = [
  {
    q: 'How does Blastup connect to my WhatsApp account?',
    a: 'Blastup connects seamlessly via standard WhatsApp Web QR code scanning using our high-performance Baileys socket engine. No expensive WhatsApp Business API fees or Meta approval waiting periods required.',
  },
  {
    q: 'Can I send messages to millions of contacts without getting banned?',
    a: 'Yes! Blastup includes intelligent anti-blocking algorithms, customizable send delays, warm-up schedules, and group segmentation to keep your account safe and maintain 99.8% delivery rates.',
  },
  {
    q: 'What type of interactive messages can I send?',
    a: 'You can send text broadcasts, media attachments (images, PDFs, videos), tap-to-continue CTA buttons, quick reply options, and e-commerce product sliders.',
  },
  {
    q: 'Can multiple team members manage conversations at the same time?',
    a: 'Absolutely. The unified Web Chat Console allows your support and sales teams to collaborate on messages simultaneously from any browser.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [audienceSize, setAudienceSize] = useState(100000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulator calculations
  const estOpen = Math.round(audienceSize * 0.98);
  const estClicks = Math.round(audienceSize * 0.42);
  const estTimeSec = Math.round(audienceSize / 5000);

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#f8fafc',
      color: '#0f172a',
      minHeight: '100vh',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Vollkorn:ital,wght@0,500;0,700;1,500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; }

        .serif-title {
          font-family: 'Vollkorn', Georgia, serif;
        }

        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.5;
          pointer-events: none;
        }

        /* Liquid Glass Water Drop Navbar */
        .waterdrop-nav {
          position: fixed;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 48px);
          max-width: 1100px;
          height: 64px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 9999px;
          box-shadow: 0 12px 40px -10px rgba(31, 38, 135, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .waterdrop-nav.scrolled {
          background: rgba(255, 255, 255, 0.75);
          box-shadow: 0 16px 50px -10px rgba(31, 38, 135, 0.12);
          border-color: rgba(255, 255, 255, 0.95);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03);
          border-color: rgba(51, 217, 81, 0.4);
        }

        .dashboard-clickable {
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
        }

        .dashboard-clickable:hover {
          transform: scale(1.015) translateY(-4px);
          box-shadow: 0 40px 110px -15px rgba(51, 217, 81, 0.25), 0 10px 30px rgba(0, 0, 0, 0.06);
        }
      `}</style>

      {/* Ambient background glows */}
      <div className="ambient-glow" style={{ width: 650, height: 650, background: '#eafbea', top: -100, left: '20%' }} />
      <div className="ambient-glow" style={{ width: 550, height: 550, background: '#e0e7ff', top: 350, right: -100 }} />
      <div className="ambient-glow" style={{ width: 600, height: 600, background: '#e0f2fe', top: 1200, left: '10%' }} />

      {/* ── LIQUID GLASS WATER DROP NAVBAR ── */}
      <header className={`waterdrop-nav ${scrolled ? 'scrolled' : ''}`}>
        {/* Real Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Logo" style={{ height: 36, objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'Features', href: '#features' },
            { label: 'Dashboard', href: '#dashboard' },
            { label: 'Simulator', href: '#simulator' },
            { label: 'Comparison', href: '#comparison' },
            { label: 'FAQ', href: '#faq' },
          ].map((item) => (
            <a key={item.label} href={item.href} style={{
              fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.2s',
            }}>
              {item.label}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" style={{
            fontSize: 13, fontWeight: 600, color: '#0f172a', padding: '8px 14px', textDecoration: 'none',
          }}>
            Sign In
          </Link>
          <Link href="/dashboard" className="btn-dark" style={{ fontSize: 12, padding: '8px 18px' }}>
            Open Dashboard <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{
        paddingTop: 150, paddingBottom: 60,
        textAlign: 'center',
        maxWidth: 1100, margin: '0 auto',
        paddingLeft: 24, paddingRight: 24,
        position: 'relative', zIndex: 1,
      }}>
        {/* Top Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 9999, padding: '6px 18px', marginBottom: 28,
          fontSize: 13, fontWeight: 600, color: '#334155',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <Sparkles size={14} style={{ color: '#33D951' }} />
          <span>Enterprise WhatsApp Bulk Broadcast &amp; AI Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="serif-title" style={{
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 700,
          lineHeight: 1.15,
          color: '#0f172a',
          letterSpacing: '-0.02em',
          maxWidth: 940,
          margin: '0 auto 24px',
        }}>
          Offer your business a better WhatsApp experience, scale your growth
        </h1>

        {/* Subhead */}
        <p style={{
          fontSize: 'clamp(15px, 1.8vw, 18px)',
          color: '#64748b',
          maxWidth: 660,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Broadcast messages to <strong>millions of contacts</strong> instantly, automate replies with an AI chatbot,
          segment target audiences, and track real-time read analytics.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <Link href="/dashboard" className="btn-primary-green" style={{ fontSize: 15 }}>
            <Zap size={16} /> Launch Millions Campaign
          </Link>
          <Link href="/login" className="btn-dark" style={{ fontSize: 15, background: 'rgba(15, 23, 42, 0.06)', color: '#0f172a', border: '1px solid #cbd5e1', boxShadow: 'none' }}>
            Explore Web Console
          </Link>
        </div>

        {/* Integrations Badges Row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
          marginBottom: 60,
        }}>
          {integrations.map((item) => {
            const IconComp = item.icon;
            return (
              <div key={item.name} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 9999,
                padding: '6px 16px',
                fontSize: 13, fontWeight: 600, color: '#334155',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}>
                <IconComp size={14} style={{ color: item.color }} />
                <span>{item.name}</span>
              </div>
            );
          })}
        </div>

        {/* ── CLICKABLE HIGH-FIDELITY DASHBOARD MOCKUP WITH FAKE MILLIONS DATA ── */}
        <div
          id="dashboard"
          className="dashboard-clickable"
          onClick={() => router.push('/dashboard')}
          title="Click to launch Blastup Dashboard"
          style={{
            position: 'relative',
            width: '100%', maxWidth: 1080,
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: 22,
            border: '2px solid rgba(51, 217, 81, 0.3)',
            boxShadow: '0 30px 90px -15px rgba(15, 23, 42, 0.12), 0 4px 20px rgba(0, 0, 0, 0.04)',
            textAlign: 'left',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
          }}
        >
          {/* Top Banner Tag inside Mockup */}
          <div style={{
            position: 'absolute', top: 12, right: 16, zIndex: 10,
            background: '#33D951', color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '4px 12px', borderRadius: 9999, boxShadow: '0 4px 12px rgba(51,217,81,0.4)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Sparkles size={12} /> CLICK TO OPEN LIVE DASHBOARD
          </div>

          {/* Left Sidebar Mockup */}
          <div style={{
            background: '#ffffff',
            borderRight: '1px solid #e8ecef',
            padding: '20px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              {/* Real Brand Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="Logo" style={{ height: 28, objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>

              {/* General Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 8 }}>
                  GENERAL
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                  background: '#eafbea', border: '1px solid #c2f5c2', color: '#1d7e2e', fontWeight: 600, fontSize: 13,
                }}>
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <Wifi size={15} />
                  <span>WhatsApp</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <MessageSquare size={15} />
                  <span>Chats</span>
                </div>
              </div>

              {/* Messaging Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 8 }}>
                  MESSAGING
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <Users size={15} />
                  <span>Contacts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <Megaphone size={15} />
                  <span>Campaigns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <Bot size={15} />
                  <span>Chatbot</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <Send size={15} />
                  <span>Send Message</span>
                </div>
              </div>

              {/* Developer Section */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 8 }}>
                  DEVELOPER
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <FileText size={15} />
                  <span>API Docs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#64748b', fontSize: 13 }}>
                  <Key size={15} />
                  <span>API Keys &amp; Settings</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', color: '#94a3b8', fontSize: 13 }}>
              <LogOut size={15} />
              <span>Logout</span>
            </div>
          </div>

          {/* Right Main Dashboard Panel with FAKE MILLIONS DATA */}
          <div style={{ background: '#f8fafc', padding: 24, paddingTop: 40 }}>
            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 className="serif-title" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Dashboard</h2>
                <p style={{ fontSize: 12, color: '#64748b' }}>Real-time analytics and platform performance</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  AS
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Aman Sharma</div>
                  <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>+916009474867</div>
                </div>
              </div>
            </div>

            {/* Top 4 Stat Cards Row (FAKE MILLIONS DATA) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 16, border: '1px solid #e8ecef' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Messages Sent</span>
                  <Info size={12} className="text-secondary" />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>2.8M</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: 9999 }}>+15.8% ↗</span>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 14, padding: 16, border: '1px solid #e8ecef' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Synced Contacts</span>
                  <Info size={12} className="text-secondary" />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>1.4M</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: 9999 }}>+24.2% ↗</span>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 14, padding: 16, border: '1px solid #e8ecef' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Conversations</span>
                  <Info size={12} className="text-secondary" />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>890K</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: 9999 }}>+8.4% ↗</span>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 14, padding: 16, border: '1px solid #e8ecef' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Messages Received</span>
                  <Info size={12} className="text-secondary" />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>4.2M</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: 9999 }}>+12.1% ↗</span>
                </div>
              </div>
            </div>

            {/* Middle Section (Analytics Bar Chart + Traffic Breakdown) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
              {/* Message Volume Analytics */}
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 18, border: '1px solid #e8ecef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BarChart3 size={15} style={{ color: '#33D951' }} />
                      Message Volume Analytics
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Daily traffic distribution &amp; response velocity</div>
                  </div>
                  <span style={{ fontSize: 10, background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, color: '#64748b', fontWeight: 600 }}>
                    Weekly Overview
                  </span>
                </div>

                {/* Simulated Bar Chart with 840K Peak */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, padding: '0 20px', marginBottom: 14 }}>
                  {[
                    { day: 'Sun', height: 35, peak: false },
                    { day: 'Mon', height: 60, peak: false },
                    { day: 'Tue', height: 95, peak: true, val: '840K' },
                    { day: 'Wed', height: 50, peak: false },
                    { day: 'Thu', height: 75, peak: false },
                    { day: 'Fri', height: 45, peak: false },
                    { day: 'Sat', height: 70, peak: false },
                  ].map((b) => (
                    <div key={b.day} style={{ textAlign: 'center', width: 28 }}>
                      {b.peak && <div style={{ fontSize: 10, fontWeight: 700, color: '#33D951', marginBottom: 4 }}>{b.val}</div>}
                      <div style={{
                        height: b.height, width: '100%',
                        borderRadius: 6,
                        background: b.peak ? '#33D951' : '#dcfce7',
                        transition: 'height 0.3s ease',
                      }} />
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>{b.day}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', borderTop: '1px dashed #f1f5f9', paddingTop: 8 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#33D951', fontWeight: 600 }}>● Peak Volume</span>
                    <span style={{ color: '#a7f3d0' }}>● Normal Range</span>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>99.8% Delivery Success</span>
                </div>
              </div>

              {/* Traffic Breakdown */}
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 18, border: '1px solid #e8ecef', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Traffic Breakdown</span>
                    <Info size={12} className="text-secondary" />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      <span>Outbound (2.8M Sent)</span>
                      <span style={{ fontWeight: 700 }}>29%</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: '29%', height: '100%', background: '#33D951', borderRadius: 3 }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      <span>Inbound (4.2M Recv)</span>
                      <span style={{ fontWeight: 700 }}>71%</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: '71%', height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <Zap size={14} style={{ color: '#33D951' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Automated Engine</div>
                    <div style={{ color: '#94a3b8', fontSize: 10 }}>Baileys Multi-Device Cluster</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row (Recent System Activity + Quick Actions) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              {/* Recent System Activity */}
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 18, border: '1px solid #e8ecef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={15} style={{ color: '#33D951' }} />
                    Recent System Activity
                  </div>
                  <span style={{ fontSize: 11, color: '#33D951', fontWeight: 600 }}>View All Logs →</span>
                </div>

                {[
                  { tag: 'info', text: 'API Key created: prod-cluster-1', time: '04:14' },
                  { tag: 'info', text: 'Auto-scaled 12 worker sockets', time: '04:10' },
                  { tag: 'info', text: 'Campaign #8492 completed: 500,000 sent', time: '04:02' },
                  { tag: 'info', text: 'Webhooks dispatched: 48,200 events', time: '03:58' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: i === 3 ? 0 : 6,
                    fontSize: 11, border: '1px solid #f1f5f9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#eff6ff', color: '#3b82f6', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                        {item.tag}
                      </span>
                      <span style={{ color: '#334155', fontWeight: 500 }}>{item.text}</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 18, border: '1px solid #e8ecef', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  Quick Actions
                </div>

                <button style={{
                  background: '#33D951', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 10, padding: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(51, 217, 81, 0.3)',
                }}>
                  <Send size={14} /> Send Quick Message
                </button>

                <button style={{
                  background: '#ffffff', color: '#334155', fontWeight: 600, border: '1px solid #e2e8f0', borderRadius: 10, padding: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, cursor: 'pointer',
                }}>
                  <Wifi size={14} /> WhatsApp Status / QR
                </button>

                <button style={{
                  background: '#ffffff', color: '#334155', fontWeight: 600, border: '1px solid #e2e8f0', borderRadius: 10, padding: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, cursor: 'pointer',
                }}>
                  <Zap size={14} /> Manage API Keys
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: INTERACTIVE CAMPAIGN SIMULATOR ── */}
      <section id="simulator" style={{
        paddingTop: 100, paddingBottom: 100,
        maxWidth: 1100, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          borderRadius: 24, padding: 48, border: '1px solid #e2e8f0',
          boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 9999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#6366f1',
              marginBottom: 16,
            }}>
              <Sliders size={14} /> LIVE CAMPAIGN DISPATCH SIMULATOR
            </div>
            <h2 className="serif-title" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 700, color: '#0f172a' }}>
              See your campaign impact at scale
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 540, margin: '8px auto 0' }}>
              Drag the slider to simulate broadcasting to your customer list in real time.
            </p>
          </div>

          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                TARGET AUDIENCE SIZE
              </div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#33D951' }}>
                {audienceSize.toLocaleString()} <span style={{ fontSize: 18, color: '#64748b' }}>Contacts</span>
              </div>
              <input
                type="range"
                min={10000}
                max={1000000}
                step={10000}
                value={audienceSize}
                onChange={(e) => setAudienceSize(Number(e.target.value))}
                style={{
                  width: '100%', height: 8, background: '#cbd5e1', borderRadius: 4, outline: 'none',
                  marginTop: 16, cursor: 'pointer', accentColor: '#33D951',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Est. Opened (98%)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{estOpen.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Read within 5 mins</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Est. CTA Clicks (42%)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{estClicks.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Button taps &amp; sales</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Dispatch Duration</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{estTimeSec}s</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Parallel socket engine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: FEATURE CARDS ── */}
      <section id="features" style={{
        paddingTop: 40, paddingBottom: 100,
        maxWidth: 1100, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(51,217,81,0.1)', border: '1px solid rgba(51,217,81,0.25)',
            borderRadius: 9999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#16a34a',
            marginBottom: 16,
          }}>
            <ShieldCheck size={14} /> ENTERPRISE CAPABILITIES
          </div>
          <h2 className="serif-title" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 700, color: '#0f172a' }}>
            Built for enterprise WhatsApp operations
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {featureCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div key={card.title} className="glass-card" style={{ borderRadius: 20, padding: 28, textAlign: 'left', background: '#ffffff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: card.accent, marginBottom: 12 }}>
                  {card.tag}
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.accent, marginBottom: 16 }}>
                  <IconComponent size={22} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>{card.desc}</p>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: card.accent }}>{card.statVal}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{card.statLabel}</div>
                  </div>
                  <CheckCircle size={20} style={{ color: card.accent }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 4: COMPARISON MATRIX ── */}
      <section id="comparison" style={{
        paddingTop: 40, paddingBottom: 100,
        maxWidth: 1100, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 9999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#6366f1',
            marginBottom: 16,
          }}>
            <BarChart3 size={14} /> CHANNEL COMPARISON
          </div>
          <h2 className="serif-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#0f172a' }}>
            Why WhatsApp Outperforms Email &amp; SMS
          </h2>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a' }}>Feature / Metric</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, color: '#33D951', background: '#eafbea' }}>Blastup WhatsApp</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, color: '#64748b' }}>Email Marketing</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, color: '#64748b' }}>SMS Marketing</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={row.feature} style={{ borderBottom: i === comparisonData.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: '#0f172a' }}>{row.feature}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: '#16a34a', background: '#f6fbf6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={16} style={{ color: '#16a34a' }} /> {row.whatsapp}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748b' }}>{row.email}</td>
                  <td style={{ padding: '16px 24px', color: '#64748b' }}>{row.sms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SECTION 5: FAQ ACCORDION ── */}
      <section id="faq" style={{
        paddingTop: 40, paddingBottom: 120,
        maxWidth: 900, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(51,217,81,0.1)', border: '1px solid rgba(51,217,81,0.25)',
            borderRadius: 9999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#16a34a',
            marginBottom: 16,
          }}>
            <HelpCircle size={14} /> FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="serif-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#0f172a' }}>
            Everything you need to know
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  border: `1px solid ${isOpen ? '#33D951' : '#e2e8f0'}`,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  style={{
                    width: '100%', padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: 16, fontWeight: 700, color: '#0f172a',
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: '#64748b' }} />
                </button>

                {isOpen && (
                  <div style={{ padding: '0 24px 20px', fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER & WATERMARK ── */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        paddingTop: 60, paddingBottom: 40,
        background: '#ffffff',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle dot grid watermark */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1100, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
          display: 'flex', flexDirection: 'column', gap: 24,
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Logo" style={{ height: 28, objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Open-Source WhatsApp Automation
              </span>
            </div>

            <div style={{ display: 'flex', gap: 24, fontSize: 13, alignItems: 'center' }}>
              <Link href="/about" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>About Us</Link>
              <Link href="/docs" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>API Docs</Link>
              <Link href="/login" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
              <Link href="/dashboard" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>Dashboard →</Link>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            fontSize: 13, color: '#64748b',
          }}>
            <div>
              © 2026 Blastup Platform. Released under MIT Open Source License.
            </div>
            {/* NON-EDITABLE BRANDING - Developed by Kalp Intelligence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Developed by</span>
              <a
                href="https://kalpintelligence.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}
              >
                Kalp Intelligence
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
