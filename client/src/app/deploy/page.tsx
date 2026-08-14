'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Copy, Check, Terminal, Server, ArrowRight, Github } from 'lucide-react';

export default function DeployGuidePage() {
  const [activeTab, setActiveTab] = useState<'docker' | 'pm2' | 'vps' | 'env'>('docker');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
        maxWidth: 880,
        margin: '0 auto',
        paddingTop: 120,
        paddingBottom: 80,
        paddingLeft: 24,
        paddingRight: 24,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#16a34a',
            marginBottom: 12,
            letterSpacing: '0.02em',
          }}>
            ● DEPLOYMENT MANUAL
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            marginBottom: 12,
          }}>
            How to self-host Blastup
          </h1>
          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.6 }}>
            Run Blastup on your own VPS, dedicated server, or local environment with zero licensing fees.
          </p>
        </div>

        {/* Minimal Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 8,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}>
          {[
            { key: 'docker', label: 'Docker Compose (Recommended)' },
            { key: 'pm2', label: 'PM2 & Node.js' },
            { key: 'vps', label: 'Nginx & SSL' },
            { key: 'env', label: 'Environment Variables' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s ease',
                background: activeTab === tab.key ? '#0f172a' : 'transparent',
                color: activeTab === tab.key ? '#ffffff' : '#64748b',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── DOCKER COMPOSE TAB ── */}
        {activeTab === 'docker' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                1. Clone the repository
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
                Clone Blastup to your server and navigate into the project directory:
              </p>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', margin: 0, overflowX: 'auto' }}>
                  git clone https://github.com/kalpintelligence/blastup.git{'\n'}
                  cd blastup
                </pre>
                <button
                  onClick={() => copyToClipboard('git clone https://github.com/kalpintelligence/blastup.git\ncd blastup', 1)}
                  style={{ position: 'absolute', right: 12, top: 12, background: '#1e293b', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                >
                  {copiedIndex === 1 ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                2. Configure environment variables
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
                Copy the example environment file and configure secrets:
              </p>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', margin: 0, overflowX: 'auto' }}>
                  cp .env.example .env{'\n'}
                  nano .env
                </pre>
                <button
                  onClick={() => copyToClipboard('cp .env.example .env\nnano .env', 2)}
                  style={{ position: 'absolute', right: 12, top: 12, background: '#1e293b', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                >
                  {copiedIndex === 2 ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                3. Start containers
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
                Launch the client, backend server, and MongoDB service in background mode:
              </p>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', margin: 0, overflowX: 'auto' }}>
                  docker compose up -d --build
                </pre>
                <button
                  onClick={() => copyToClipboard('docker compose up -d --build', 3)}
                  style={{ position: 'absolute', right: 12, top: 12, background: '#1e293b', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                >
                  {copiedIndex === 3 ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>
                Once started, open <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>http://your-server-ip:3000</code> in your browser to sign in and scan your WhatsApp QR code.
              </p>
            </div>
          </div>
        )}

        {/* ── PM2 & NODE.JS TAB ── */}
        {activeTab === 'pm2' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                1. Install dependencies &amp; build
              </h2>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', margin: 0, overflowX: 'auto' }}>
                  cd server &amp;&amp; npm install &amp;&amp; npm run build{'\n'}
                  cd ../client &amp;&amp; npm install &amp;&amp; npm run build
                </pre>
                <button
                  onClick={() => copyToClipboard('cd server && npm install && npm run build\ncd ../client && npm install && npm run build', 4)}
                  style={{ position: 'absolute', right: 12, top: 12, background: '#1e293b', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                >
                  {copiedIndex === 4 ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                2. Start services with PM2
              </h2>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', margin: 0, overflowX: 'auto' }}>
                  pm2 start server/dist/index.js --name &quot;blastup-server&quot;{'\n'}
                  pm2 start npm --name &quot;blastup-client&quot; -- start --prefix client{'\n'}
                  pm2 save
                </pre>
                <button
                  onClick={() => copyToClipboard('pm2 start server/dist/index.js --name "blastup-server"\npm2 start npm --name "blastup-client" -- start --prefix client\npm2 save', 5)}
                  style={{ position: 'absolute', right: 12, top: 12, background: '#1e293b', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                >
                  {copiedIndex === 5 ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NGINX & SSL TAB ── */}
        {activeTab === 'vps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                Nginx Reverse Proxy Configuration
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
                Forward traffic from your domain to the Next.js frontend (port 3000) and API server (port 3001):
              </p>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', margin: 0, overflowX: 'auto' }}>
{`server {
    server_name wa.kalp.ltd; # or your custom domain

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`}
                </pre>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                SSL with Let&apos;s Encrypt Certbot
              </h2>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 18px', position: 'relative' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', margin: 0, overflowX: 'auto' }}>
                  sudo certbot --nginx -d wa.kalp.ltd
                </pre>
                <button
                  onClick={() => copyToClipboard('sudo certbot --nginx -d wa.kalp.ltd', 6)}
                  style={{ position: 'absolute', right: 12, top: 12, background: '#1e293b', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                >
                  {copiedIndex === 6 ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ENVIRONMENT VARIABLES TAB ── */}
        {activeTab === 'env' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Variable</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Default</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { v: 'PORT', d: '3001', desc: 'Express API Server port' },
                  { v: 'MONGODB_URI', d: 'mongodb://localhost:27017/blastup', desc: 'MongoDB connection string' },
                  { v: 'JWT_SECRET', d: 'secure-random-secret', desc: 'Secret for signing authentication tokens' },
                  { v: 'CLIENT_ORIGIN', d: 'http://localhost:3000', desc: 'Frontend origin for CORS' },
                  { v: 'NODE_ENV', d: 'production', desc: 'Environment mode (development/production)' },
                  { v: 'MAX_DELAY_MS', d: '3000', desc: 'Anti-ban SafeMode throttle delay' },
                ].map((row) => (
                  <tr key={row.v} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{row.v}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748b' }}>{row.d}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
