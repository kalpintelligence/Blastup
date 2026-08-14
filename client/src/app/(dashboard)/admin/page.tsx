'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { adminApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import {
  Users, Shield, ShieldCheck, ShieldOff, Trash2, RefreshCw,
  Circle, Clock, UserCheck, UserX, AlertTriangle, Lock, ArrowLeft
} from 'lucide-react';

interface UserAccount {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  isOnline: boolean;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser().then(u => {
      if (u?.role === 'admin') {
        setIsAdmin(true);
        loadUsers();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });
  }, []);

  const handleToggleStatus = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.toggleUserStatus(id);
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${username}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await adminApi.deleteUser(id);
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (isAdmin === false) {
    return (
      <div>
        <Header title="Admin Access Required" subtitle="Restricted Section" />
        <div className="page-content" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '48px 32px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Lock size={32} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
              Access Restricted
            </h2>
            <p className="text-secondary" style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              You must be logged in with an administrator account to view or manage registered platform users.
            </p>
            <Link href="/dashboard" className="btn btn-primary flex items-center justify-center gap-2" style={{ margin: '0 auto', width: 'fit-content' }}>
              <ArrowLeft size={16} /> Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onlineCount = users.filter(u => u.isOnline).length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div>
      <Header title="Admin — Accounts" subtitle="Manage all registered user accounts, online status, and activity" />
      <div className="page-content" style={{ maxWidth: 1100 }}>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            {
              label: 'Total Accounts',
              value: users.length,
              icon: Users,
              color: '#6366f1',
              bg: 'rgba(99, 102, 241, 0.08)',
              border: 'rgba(99, 102, 241, 0.2)',
            },
            {
              label: 'Online Now',
              value: onlineCount,
              icon: Circle,
              color: '#22c55e',
              bg: 'rgba(34, 197, 94, 0.08)',
              border: 'rgba(34, 197, 94, 0.2)',
            },
            {
              label: 'Active Accounts',
              value: activeCount,
              icon: UserCheck,
              color: '#3b82f6',
              bg: 'rgba(59, 130, 246, 0.08)',
              border: 'rgba(59, 130, 246, 0.2)',
            },
            {
              label: 'Deactivated',
              value: users.length - activeCount,
              icon: UserX,
              color: '#ef4444',
              bg: 'rgba(239, 68, 68, 0.08)',
              border: 'rgba(239, 68, 68, 0.2)',
            },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card" style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '18px 20px',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${stat.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{stat.value}</div>
                  <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="card" style={{
          marginBottom: 20,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} className="text-accent" />
            <span className="font-semibold text-sm">All Registered Accounts</span>
            <span className="text-xs text-secondary">({users.length})</span>
          </div>
          <button
            className="btn btn-secondary btn-sm flex items-center gap-2"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <RefreshCw size={32} style={{ margin: '0 auto 12px', color: 'var(--color-text-tertiary)', animation: 'spin 1s linear infinite' }} />
            <p className="text-secondary text-sm">Loading accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <Users size={40} style={{ margin: '0 auto 12px', color: 'var(--color-text-tertiary)' }} />
            <p className="text-secondary text-sm">No accounts found.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--color-bg-secondary)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>User</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>Online</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>Last Seen</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>Created</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.id} style={{
                      borderBottom: idx < users.length - 1 ? '1px solid var(--color-border)' : 'none',
                      opacity: u.isActive ? 1 : 0.55,
                      transition: 'all 0.2s',
                    }}>
                      {/* User */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: u.isOnline
                              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                              : 'linear-gradient(135deg, #94a3b8, #64748b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: 14,
                            textTransform: 'uppercase',
                            position: 'relative',
                          }}>
                            {u.username.charAt(0)}
                            {u.isOnline && (
                              <div style={{
                                position: 'absolute', bottom: -1, right: -1,
                                width: 12, height: 12, borderRadius: '50%',
                                background: '#22c55e',
                                border: '2px solid var(--color-bg-secondary)',
                                animation: 'pulse 2s infinite',
                              }} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ fontSize: 13 }}>{u.username}</div>
                            <div className="text-xs text-secondary">ID: {u.id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: u.role === 'admin' ? '#6366f1' : '#3b82f6',
                          border: u.role === 'admin' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}>
                          {u.role === 'admin' ? '👑 Admin' : 'User'}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          background: u.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: u.isActive ? '#16a34a' : '#ef4444',
                          border: u.isActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        }}>
                          {u.isActive ? '● Active' : '○ Disabled'}
                        </span>
                      </td>

                      {/* Online */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {u.isOnline ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 600, color: '#22c55e',
                          }}>
                            <Circle size={8} fill="#22c55e" /> Online
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 500, color: 'var(--color-text-tertiary)',
                          }}>
                            <Circle size={8} /> Offline
                          </span>
                        )}
                      </td>

                      {/* Last Seen */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <Clock size={12} />
                          {timeAgo(u.lastSeenAt)}
                        </div>
                      </td>

                      {/* Created */}
                      <td style={{ padding: '14px 16px' }}>
                        <span className="text-xs text-secondary">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleStatus(u.id)}
                            disabled={actionLoading === u.id}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            style={{
                              padding: '5px 10px',
                              display: 'flex', alignItems: 'center', gap: 4,
                              color: u.isActive ? '#f59e0b' : '#22c55e',
                              fontSize: 11,
                            }}
                          >
                            {u.isActive ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={actionLoading === u.id}
                            title="Delete Account"
                            style={{
                              padding: '5px 10px',
                              display: 'flex', alignItems: 'center', gap: 4,
                              color: '#ef4444',
                              fontSize: 11,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Warning Note */}
        <div style={{
          marginTop: 20,
          padding: '14px 18px',
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 12,
          color: '#92400e',
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="font-semibold" style={{ marginBottom: 2 }}>Admin Security Notice</div>
            <span style={{ color: '#a16207' }}>
              Deactivating or deleting an account is immediate and cannot be undone. Online status is based on a 5-minute activity threshold.
            </span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
