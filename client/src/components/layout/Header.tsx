'use client';

import { UserCircle, LogOut, ChevronDown, Wifi, WifiOff, Info, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authApi, whatsappApi } from '@/lib/api';
import { logout } from '@/lib/auth';
import { useMobileNav } from '@/components/layout/DashboardShell';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface ProfileState {
  displayName: string;
  subtext: string;
  avatarUrl: string | null;
  initials: string;
  isWA: boolean;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { toggleMobileSidebar } = useMobileNav();

  const [profile, setProfile] = useState<ProfileState>({
    displayName: 'Loading...',
    subtext: '',
    avatarUrl: null,
    initials: '?',
    isWA: false,
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [meRes, waRes] = await Promise.all([
          authApi.me().catch(() => null),
          whatsappApi.getStatus().catch(() => null),
        ]);

        const dbUser = meRes?.data?.user;
        const waData = waRes?.data;

        if (waData && waData.status === 'connected' && (waData.pushName || waData.phone)) {
          const waName = waData.pushName || (waData.phone ? `+${waData.phone}` : 'WhatsApp User');
          const waPhone = waData.phone ? `+${waData.phone}` : 'Connected';
          const initials = waName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'WA';

          setProfile({
            displayName: waName,
            subtext: waPhone,
            avatarUrl: waData.profilePicUrl || null,
            initials,
            isWA: true,
          });
        } else if (dbUser) {
          const initials = dbUser.username.slice(0, 2).toUpperCase();
          setProfile({
            displayName: dbUser.username,
            subtext: 'WhatsApp Disconnected',
            avatarUrl: null,
            initials,
            isWA: false,
          });
        }
      } catch {
        // fallback
      }
    }

    loadProfile();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="page-header">
      <div className="header-left">
        {/* Mobile hamburger menu */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileSidebar}
          aria-label="Open Sidebar"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-actions">
        {/* About Us Link in Top Bar */}
        <Link
          href="/about"
          id="topbar-about-us"
          className="about-us-link"
        >
          <Info size={15} style={{ color: '#16a34a' }} />
          <span>About Us</span>
        </Link>

        {/* Profile Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="user-profile-badge"
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{ border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="user-avatar"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="user-avatar" style={{
                backgroundColor: profile.isWA ? 'rgba(51, 217, 81, 0.15)' : 'var(--color-bg)',
                color: profile.isWA ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}>
                {profile.initials}
              </div>
            )}

            <div className="profile-text-wrapper" style={{ paddingRight: 4 }}>
              <div className="font-semibold text-sm" style={{ lineHeight: 1.1 }}>
                {profile.displayName}
              </div>
              <div className="text-xs text-secondary" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                {profile.isWA ? (
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Wifi size={10} /> {profile.subtext}
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <WifiOff size={10} /> {profile.subtext}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown
              size={12}
              style={{
                color: 'var(--color-text-tertiary)',
                marginRight: 2,
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: 220,
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                overflow: 'hidden',
                animation: 'modalIn 0.15s ease-out',
              }}
            >
              {/* Profile Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg)',
                }}
              >
                <div className="font-serif font-bold" style={{ fontSize: 14 }}>
                  {profile.displayName}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                  {profile.subtext}
                </div>
              </div>

              {/* Menu Items */}
              <div style={{ padding: '6px 0' }}>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 16px',
                    fontSize: 13,
                    color: 'var(--color-text)',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <UserCircle size={15} style={{ color: 'var(--color-text-secondary)' }} />
                  My Profile
                </Link>

                <Link
                  href="/about"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 16px',
                    fontSize: 13,
                    color: 'var(--color-text)',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Info size={15} style={{ color: '#16a34a' }} />
                  About Us
                </Link>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: '4px 0' }} />

                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 16px',
                    fontSize: 13,
                    color: 'var(--color-danger)',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
