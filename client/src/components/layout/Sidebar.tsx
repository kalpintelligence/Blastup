'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wifi, MessageSquare, Users,
  Send, Megaphone, BookOpen, Key, LogOut, Minus, Plus, Folder, X
} from 'lucide-react';
import { logout } from '@/lib/auth';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [chatbotOpen, setChatbotOpen] = useState(true);

  const isChatbotActive = pathname.startsWith('/chatbot');

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
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
        {/* Mobile close button */}
        {onClose && (
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* GENERAL */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">GENERAL</span>
          <Link
            href="/dashboard"
            className={`sidebar-item ${pathname === '/dashboard' ? 'active' : ''}`}
            id="nav-dashboard"
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/whatsapp"
            className={`sidebar-item ${pathname.startsWith('/whatsapp') ? 'active' : ''}`}
            id="nav-whatsapp"
          >
            <Wifi />
            <span>WhatsApp</span>
          </Link>
          <Link
            href="/chats"
            className={`sidebar-item ${pathname.startsWith('/chats') ? 'active' : ''}`}
            id="nav-chats"
          >
            <MessageSquare />
            <span>Chats</span>
          </Link>
        </div>

        {/* MESSAGING */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">MESSAGING</span>
          <Link
            href="/contacts"
            className={`sidebar-item ${pathname.startsWith('/contacts') ? 'active' : ''}`}
            id="nav-contacts"
          >
            <Users />
            <span>Contacts</span>
          </Link>
          <Link
            href="/campaigns"
            className={`sidebar-item ${pathname.startsWith('/campaigns') ? 'active' : ''}`}
            id="nav-campaigns"
          >
            <Megaphone />
            <span>Campaigns</span>
          </Link>

          {/* CHATBOT TREE SECTION (Matching user provided design) */}
          <div className="tree-group" style={{ margin: '6px 0' }}>
            {/* Header pill capsule */}
            <div
              className={`tree-header ${isChatbotActive ? 'header-active' : ''}`}
              onClick={() => setChatbotOpen(!chatbotOpen)}
              id="nav-chatbot-tree-toggle"
            >
              <div className="tree-header-left">
                <Folder size={18} />
                <span>Chatbot</span>
              </div>
              <button
                type="button"
                className="tree-toggle-btn"
                aria-label="Toggle Chatbot Submenu"
              >
                {chatbotOpen ? <Minus size={14} /> : <Plus size={14} />}
              </button>
            </div>

            {/* Tree sub-items container */}
            {chatbotOpen && (
              <div className="tree-children">
                {/* Vertical tree connector line */}
                <div className="tree-line" />

                {/* Sub-item 1: Chatbot */}
                <div className="tree-child-wrapper">
                  <div className="tree-dot" />
                  <Link
                    href="/chatbot"
                    className={`tree-child-item ${pathname === '/chatbot' ? 'active' : ''}`}
                    id="nav-chatbot"
                  >
                    <Folder size={16} />
                    <span>Chatbot</span>
                  </Link>
                </div>

                {/* Sub-item 2: Chatbot Leads */}
                <div className="tree-child-wrapper">
                  <div className="tree-dot" />
                  <Link
                    href="/chatbot/leads"
                    className={`tree-child-item ${pathname === '/chatbot/leads' ? 'active' : ''}`}
                    id="nav-chatbot-leads"
                  >
                    <Folder size={16} />
                    <span>Chatbot Leads</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/send"
            className={`sidebar-item ${pathname.startsWith('/send') ? 'active' : ''}`}
            id="nav-send-message"
          >
            <Send />
            <span>Send Message</span>
          </Link>
        </div>

        {/* DEVELOPER */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">DEVELOPER</span>
          <Link
            href="/docs"
            className={`sidebar-item ${pathname.startsWith('/docs') ? 'active' : ''}`}
            id="nav-api-docs"
          >
            <BookOpen />
            <span>API Docs</span>
          </Link>
          <Link
            href="/settings"
            className={`sidebar-item ${pathname.startsWith('/settings') ? 'active' : ''}`}
            id="nav-api-keys---settings"
          >
            <Key />
            <span>API Keys & Settings</span>
          </Link>
        </div>
      </div>

      {/* Footer / Logout & Non-editable Branding */}
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

        {/* NON-EDITABLE BRANDING - Developed by Kalp Intelligence */}
        <div style={{
          marginTop: 10,
          padding: '8px 12px 4px 12px',
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          textAlign: 'center',
          fontSize: 11,
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          flexWrap: 'wrap',
        }}>
          <span>Developed by</span>
          <a
            href="https://kalpintelligence.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}
          >
            Kalp Intelligence
          </a>
        </div>
      </div>
    </aside>
  );
}

