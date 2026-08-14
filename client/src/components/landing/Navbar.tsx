'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Github, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>{`
        .site-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          z-index: 1000;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          transition: all 0.2s ease;
        }

        .site-nav.scrolled {
          background: rgba(255, 255, 255, 0.98);
          border-bottom-color: rgba(15, 23, 42, 0.1);
        }

        .nav-inner {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0 24px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-link {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .nav-link:hover {
          color: #0f172a;
        }

        .nav-btn-primary {
          background: #0f172a;
          color: #ffffff;
          border-radius: 6px;
          padding: 6px 14px;
          font-weight: 500;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .nav-btn-primary:hover {
          background: #1e293b;
        }

        .nav-btn-github {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .nav-btn-github:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        @media (max-width: 768px) {
          .desktop-links, .desktop-actions {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-toggle, .mobile-drawer {
            display: none !important;
          }
        }
      `}</style>

      <header className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Blastup" style={{ height: 26, objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
            </Link>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#16a34a',
              background: '#f0fdf4',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #dcfce7',
            }}>
              MIT Open Source
            </span>
          </div>

          {/* Center Links */}
          <nav className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/#features" className="nav-link">
              Features
            </Link>
            <Link href="/chatbot" className="nav-link">
              Chatbot
            </Link>
            <Link href="/deploy" className="nav-link">
              Deploy
            </Link>
            <Link href="/about" className="nav-link">
              About
            </Link>
            <Link href="/#faq" className="nav-link">
              FAQ
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href="https://github.com/kalpintelligence/blastup"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn-github"
            >
              <Github size={13} />
              <span>GitHub</span>
            </a>

            <Link href="/login" className="nav-link" style={{ padding: '4px 8px' }}>
              Sign In
            </Link>

            <Link href="/dashboard" className="nav-btn-primary">
              Dashboard <ArrowRight size={12} />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 6,
              background: '#f1f5f9',
              border: 'none',
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer"
          style={{
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '20px 24px',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', textDecoration: 'none' }}>
            Features
          </Link>
          <Link href="/chatbot" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', textDecoration: 'none' }}>
            Chatbot
          </Link>
          <Link href="/deploy" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', textDecoration: 'none' }}>
            Deploy Guide
          </Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', textDecoration: 'none' }}>
            About Us
          </Link>
          <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', textDecoration: 'none' }}>
            FAQ
          </Link>

          <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textAlign: 'center', padding: '9px', borderRadius: 6,
                border: '1px solid #cbd5e1', color: '#0f172a', fontSize: 13, fontWeight: 500, textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textAlign: 'center', padding: '9px', borderRadius: 6,
                background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 500, textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
