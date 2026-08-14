'use client';

import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowRight, ExternalLink, Github, Check } from 'lucide-react';

export default function PublicAboutPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#0F172A',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <Navbar />

      <main style={{
        maxWidth: 780,
        margin: '0 auto',
        paddingTop: 120,
        paddingBottom: 80,
        paddingLeft: 24,
        paddingRight: 24,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#16a34a',
            marginBottom: 12,
            letterSpacing: '0.02em',
          }}>
            ● ABOUT BLASTUP
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            marginBottom: 16,
          }}>
            Open infrastructure for WhatsApp messaging.
          </h1>
          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.6 }}>
            Blastup is an open-source WhatsApp broadcast and chatbot platform developed by <strong style={{ color: '#0f172a' }}>Kalp Intelligence</strong>. It provides an unmetered, privacy-first alternative to closed, per-message cloud APIs.
          </p>
        </div>

        {/* Story Section */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 32, marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
            Why we built Blastup
          </h2>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 16 }}>
            Businesses wanting to communicate with their audience on WhatsApp are typically faced with high per-conversation fees, strict template delays, and proprietary platform lock-in.
          </p>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            We created Blastup under the MIT license to give developers and teams direct control over their WhatsApp communication: send unlimited broadcasts, build automated 24/7 chatflows, and self-host on their own servers with complete data ownership.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 32, marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>
            What sets Blastup apart
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                1. 100% Free &amp; Open Source
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                Released under the MIT License. Deploy via Docker Compose or Node.js on any server. No subscription fees, no user limits, and full code transparency.
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                2. Unlimited WhatsApp Campaigns
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                Send broadcasts to segmented contact groups with personalized merge tags, action buttons, and product sliders. Built-in SafeMode delay pacing keeps your numbers healthy.
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                3. Visual No-Code Chatbot
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                Construct automated inquiry workflows and lead capture forms in a visual node editor. Test conversational journeys instantly in an interactive phone simulator.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 32, marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
            Technology Stack
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13, color: '#334155' }}>
              <strong>Frontend:</strong> Next.js 14, React, TypeScript
            </div>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13, color: '#334155' }}>
              <strong>Backend:</strong> Express.js, Node.js, TypeScript
            </div>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13, color: '#334155' }}>
              <strong>Database:</strong> MongoDB &amp; Redis
            </div>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13, color: '#334155' }}>
              <strong>WhatsApp Engine:</strong> Baileys Multi-Device Socket
            </div>
          </div>
        </div>

        {/* Developer Attribution Box */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: 24,
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Developed by Kalp Intelligence</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Engineering open, reliable software infrastructure.</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href="https://kalpintelligence.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 14px',
                borderRadius: 6,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Website <ExternalLink size={12} />
            </a>
            <a
              href="https://github.com/kalpintelligence/blastup"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 14px',
                borderRadius: 6,
                background: '#0f172a',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <Github size={13} /> GitHub
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
