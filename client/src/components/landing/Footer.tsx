import Link from 'next/link';
import { ExternalLink, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #f1f5f9',
      paddingTop: 48,
      paddingBottom: 40,
      background: '#ffffff',
    }}>
      <div style={{
        maxWidth: 1040,
        margin: '0 auto',
        paddingLeft: 24,
        paddingRight: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}>
        {/* Main Footer Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Blastup" style={{ height: 24, objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Open-Source WhatsApp Platform
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/#features" style={{ color: '#64748b', textDecoration: 'none' }}>Features</Link>
            <Link href="/chatbot" style={{ color: '#64748b', textDecoration: 'none' }}>Chatbot</Link>
            <Link href="/deploy" style={{ color: '#64748b', textDecoration: 'none' }}>Deploy</Link>
            <Link href="/about" style={{ color: '#64748b', textDecoration: 'none' }}>About</Link>
            <Link href="/docs" style={{ color: '#64748b', textDecoration: 'none' }}>API Docs</Link>
            <a
              href="https://github.com/kalpintelligence/blastup"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Github size={13} /> GitHub
            </a>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div style={{
          borderTop: '1px solid #f8fafc',
          paddingTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: '#94a3b8',
        }}>
          <div>
            © 2026 Blastup. MIT License.
          </div>

          {/* NON-EDITABLE BRANDING */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Developed by</span>
            <a
              href="https://kalpintelligence.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              Kalp Intelligence <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
