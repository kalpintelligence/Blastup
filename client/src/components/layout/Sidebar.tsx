'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wifi, MessageSquare, Users,
  Send, BookOpen, Key, ScrollText, LogOut
} from 'lucide-react';
import { logout } from '@/lib/auth';

const navSections = [
  {
    title: 'GENERAL',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/whatsapp', label: 'WhatsApp', icon: Wifi },
      { href: '/chats', label: 'Chats', icon: MessageSquare },
    ],
  },
  {
    title: 'MESSAGING',
    items: [
      { href: '/contacts', label: 'Contacts', icon: Users },
      { href: '/send', label: 'Send Message', icon: Send },
    ],
  },
  {
    title: 'DEVELOPER',
    items: [
      { href: '/docs', label: 'API Docs', icon: BookOpen },
      { href: '/settings', label: 'API Keys & Settings', icon: Key },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Header / Brand with logo.svg */}
      <div className="sidebar-header">
        <Image
          src="/logo.svg"
          alt="Blastup Logo"
          width={110}
          height={32}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {navSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <span className="sidebar-section-title">{section.title}</span>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  id={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button
          id="sidebar-logout"
          className="sidebar-item"
          style={{ width: '100%', cursor: 'pointer', border: 'none', background: 'none' }}
          onClick={() => logout()}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
