'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ShieldCheck, Cpu, Zap, Code, Sparkles, ArrowLeft } from 'lucide-react';

export default function PublicAboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div style={{ height: 20, width: 1, background: '#cbd5e1' }} />
          <Image src="/logo.svg" alt="Blastup Logo" width={110} height={30} style={{ objectFit: 'contain' }} priority />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Sign In
          </Link>
          <Link
            href="/dashboard"
            style={{
              background: '#16a34a', color: '#ffffff', padding: '8px 18px', borderRadius: 8,
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* CONTENT CONTAINER */}
      <main style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* HERO CARD */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 24,
          padding: '56px 48px',
          color: '#ffffff',
          marginBottom: 40,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
        }}>
          <div style={{
            position: 'absolute', top: '-40%', right: '-10%',
            width: 450, height: 450,
            background: 'radial-gradient(circle, rgba(22,163,74,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 850 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 9999,
              background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)',
              color: '#4ade80', fontSize: 13, fontWeight: 600, marginBottom: 24,
            }}>
              <Sparkles size={14} /> Developed by Kalp Intelligence
            </div>

            <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 20, lineHeight: 1.2, color: '#ffffff' }}>
              Blastup — Open-Source WhatsApp Automation Platform
            </h1>

            <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>
              Engineered by <strong style={{ color: '#ffffff' }}>Kalp Intelligence</strong>, Blastup is a modern, developer-friendly open-source platform designed to streamline multi-device WhatsApp messaging, AI chatbot auto-responses, bulk broadcasting, and custom API workflows.
            </p>

            <a
              href="https://kalpintelligence.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 28px', borderRadius: 12,
                background: '#16a34a', color: '#ffffff',
                fontWeight: 700, fontSize: 15, textDecoration: 'none',
                boxShadow: '0 10px 20px -5px rgba(22,163,74,0.4)',
              }}
            >
              Visit Kalp Intelligence Website <ExternalLink size={18} />
            </a>
          </div>
        </div>

        {/* PILLARS */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
          Core Capabilities & Technology Stack
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 48,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, padding: 32,
            border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: 20,
            }}>
              <Zap size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Multi-Device Socket Gateway
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              Direct WhatsApp Web protocol connection utilizing Baileys sockets. Connect effortlessly using QR code scanning without expensive API message quotas.
            </p>
          </div>

          <div style={{
            background: '#ffffff', borderRadius: 20, padding: 32,
            border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', marginBottom: 20,
            }}>
              <Cpu size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Conversational AI & Lead Capture
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              Intelligent keyword & intent scoring engine engineered by Kalp Intelligence to automatically address customer inquiries and qualify leads 24/7.
            </p>
          </div>

          <div style={{
            background: '#ffffff', borderRadius: 20, padding: 32,
            border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', marginBottom: 20,
            }}>
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              SafeMode Antiban Protection
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              Advanced anti-ban engine featuring randomized delay intervals, message variation rotation, and account health monitoring.
            </p>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer style={{
        background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '32px 24px',
        textAlign: 'center', fontSize: 14, color: '#64748b',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>© 2026 Blastup Platform. Released under MIT Open Source License.</div>
          <div>
            Developed by{' '}
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
      </footer>
    </div>
  );
}
