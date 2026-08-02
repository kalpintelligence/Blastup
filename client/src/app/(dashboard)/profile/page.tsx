'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { authApi, whatsappApi } from '@/lib/api';
import {
  User, Shield, Clock, MapPin, Key, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, LogOut, Wifi, WifiOff, Phone, Smartphone
} from 'lucide-react';
import { logout } from '@/lib/auth';

interface UserProfile {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

interface WhatsAppProfile {
  status: string;
  phone: string | null;
  pushName: string | null;
  profilePicUrl: string | null;
  platform: string | null;
  lastConnectedAt: string | null;
}

export default function ProfilePage() {
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [waProfile, setWaProfile] = useState<WhatsAppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, waRes] = await Promise.all([
          authApi.me().catch(() => null),
          whatsappApi.getStatus().catch(() => null),
        ]);
        if (meRes?.data?.user) setDbUser(meRes.data.user);
        if (waRes?.data) setWaProfile(waRes.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwResult(null);

    if (newPassword !== confirmPassword) {
      setPwResult({ success: false, message: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setPwResult({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwResult({ success: true, message: 'Password updated successfully! Signing you out...' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      setPwResult({ success: false, message: err?.data?.message || err?.message || 'Failed to update password' });
    } finally {
      setPwLoading(false);
    }
  };

  const isConnected = waProfile?.status === 'connected' && (waProfile.pushName || waProfile.phone);

  const displayName = isConnected
    ? waProfile.pushName || `+${waProfile.phone}`
    : dbUser?.username || 'User';

  const displayPhone = isConnected && waProfile?.phone ? `+${waProfile.phone}` : null;
  const profilePic = isConnected ? waProfile?.profilePicUrl : null;
  const initials = displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'U';

  if (loading) {
    return (
      <>
        <Header title="Profile" subtitle="Your profile and account settings" />
        <div className="page-content">
          <div className="empty-state"><div className="spinner" /></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Profile" subtitle="WhatsApp account details & security settings" />
      <div className="page-content">
        <div style={{ maxWidth: 680 }}>

          {/* Profile Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="flex items-center gap-5" style={{ padding: '8px 0 20px' }}>
              {/* Profile Image / Avatar */}
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={displayName}
                  style={{
                    width: 76, height: 76, borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid var(--color-primary)', flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  backgroundColor: isConnected ? 'rgba(51, 217, 81, 0.12)' : 'var(--color-bg)',
                  color: isConnected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontFamily: 'var(--font-serif)', fontWeight: 700,
                  border: `3px solid ${isConnected ? 'var(--color-primary)' : 'var(--color-border)'}`, flexShrink: 0,
                }}>
                  {initials}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22,
                  color: 'var(--color-text)',
                }}>
                  {displayName}
                </div>

                <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                  {isConnected ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Wifi size={12} /> WhatsApp Connected
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <WifiOff size={12} /> WhatsApp Disconnected
                    </span>
                  )}

                  {displayPhone && (
                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} /> {displayPhone}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-danger)' }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              }}>
                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <Smartphone size={12} /> WhatsApp Device
                  </div>
                  <div className="font-medium text-sm">
                    {isConnected ? (waProfile?.platform || 'WhatsApp Mobile / Multi-Device') : 'Not scanned'}
                  </div>
                </div>

                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <Phone size={12} /> WhatsApp Number
                  </div>
                  <div className="font-medium text-sm" style={{ fontFamily: 'monospace' }}>
                    {displayPhone || 'Not connected'}
                  </div>
                </div>

                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <Clock size={12} /> Last Login
                  </div>
                  <div className="font-medium text-sm">
                    {dbUser?.lastLoginAt
                      ? new Date(dbUser.lastLoginAt).toLocaleString()
                      : 'Never recorded'}
                  </div>
                </div>

                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <User size={12} /> System Account
                  </div>
                  <div className="font-medium text-sm">
                    {dbUser?.username || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title flex items-center gap-2">
                <Lock size={18} style={{ color: 'var(--color-primary)' }} />
                Change Password
              </span>
            </div>
            <p className="text-xs text-secondary" style={{ marginBottom: 16 }}>
              Update system access credentials. Updating password will end active sessions.
            </p>

            {pwResult && (
              <div
                className="flex items-center gap-2"
                style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  background: pwResult.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: pwResult.success ? 'var(--color-success)' : 'var(--color-danger)',
                  border: `1px solid ${pwResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  fontSize: 13,
                }}
              >
                {pwResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {pwResult.message}
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="current-password">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 38, paddingRight: 40 }}
                    placeholder="Your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={pwLoading}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 0 }}>
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 38, paddingRight: 40 }}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    minLength={8}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={pwLoading}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 0 }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirm-new-password">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    id="confirm-new-password"
                    type={showNew ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={pwLoading}
                  />
                </div>
              </div>

              <button
                id="change-password-submit"
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', minWidth: 180 }}
                disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                <Lock size={14} />
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
