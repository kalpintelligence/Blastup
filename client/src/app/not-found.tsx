'use client';

import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowLeft, LayoutDashboard, Bot, Server, BookOpen, Github } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <Navbar />

      <main style={{
        maxWidth: 640,
        margin: '0 auto',
        paddingTop: 150,
        paddingBottom: 90,
        paddingLeft: 24,
        paddingRight: 24,
        textAlign: 'center',
      }}>
        {/* Error Code Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#16a34a',
          background: '#f0fdf4',
          border: '1px solid #dcfce7',
          padding: '4px 12px',
          borderRadius: 9999,
          marginBottom: 20,
          letterSpacing: '0.04em',
        }}>
          404 — PAGE NOT FOUND
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 44px)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.03em',
          color: '#0f172a',
          marginBottom: 16,
        }}>
          This page could not be found.
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 15,
          color: '#64748b',
          lineHeight: 1.6,
          marginBottom: 32,
          maxWidth: 480,
          margin: '0 auto 32px',
        }}>
          The URL you requested may have been moved, renamed, or does not exist. Choose one of the links below to get back on track.
        </p>

        {/* Primary Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 44,
        }}>
          <Link
            href="/"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            <ArrowLeft size={15} /> Back to Home
          </Link>

          <Link
            href="/dashboard"
            style={{
              background: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={15} color="#16a34a" /> Dashboard
          </Link>
        </div>

        {/* Helpful Shortcut Grid */}
        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: 32,
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            Helpful Destinations
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}>
            <Link
              href="/chatbot/no-code"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Bot size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>No-Code Chatbot</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Visual flow designer</div>
              </div>
            </Link>

            <Link
              href="/deploy"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Server size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Deploy Guide</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Self-host with Docker</div>
              </div>
            </Link>

            <Link
              href="/docs"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <BookOpen size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>API Reference</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>REST endpoints &amp; webhooks</div>
              </div>
            </Link>

            <a
              href="https://github.com/kalpintelligence/blastup"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                <Github size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>GitHub Repository</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Open source source code</div>
              </div>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
