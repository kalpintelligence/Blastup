'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Header from '@/components/layout/Header';
import { whatsappApi, safeModeApi } from '@/lib/api';
import { SkeletonStatusCard, Shimmer } from '@/components/ui/Skeleton';
import { RefreshCw, Trash2, LogOut, QrCode, CheckCircle2, Loader2, Shield, ShieldOff, Zap } from 'lucide-react';
import Modal from '@/components/ui/Modal';

const statusLabels: Record<string, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',
  qr_ready: 'Waiting for Scan',
  error: 'Error',
};

type ViewState = 'loading' | 'qr_setup' | 'qr_ready' | 'connecting' | 'connected' | 'error';
const QR_POLL_INTERVAL_MS = 60000;
const STATUS_POLL_INTERVAL_MS = 60000;

export default function WhatsAppPage() {
  const [status, setStatus] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [safeModeStatus, setSafeModeStatus] = useState<any>(null);
  const [safeModeLoading, setSafeModeLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const lastQrFetchAtRef = useRef(0);
  const qrRef = useRef<string | null>(null);
  const generatePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearGeneratePoll = useCallback(() => {
    if (generatePollRef.current) {
      clearInterval(generatePollRef.current);
      generatePollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await whatsappApi.getStatus();
      const data = res.data;
      setStatus(data);

      const st = data?.status;

      if (st === 'connected') {
        setViewState('connected');
        setQr(null);
        qrRef.current = null;
        lastQrFetchAtRef.current = 0;
        clearGeneratePoll();

        // Fetch safe mode status if we have instanceId
        if (data.instanceId) {
          safeModeApi.getStatus(data.instanceId)
            .then(smRes => setSafeModeStatus(smRes.data))
            .catch(() => {});
        }
      } else if (st === 'qr_ready') {
        const shouldFetchQr =
          !qrRef.current || Date.now() - lastQrFetchAtRef.current >= QR_POLL_INTERVAL_MS;

        if (shouldFetchQr) {
          const qrRes = await whatsappApi.getQR().catch(() => null);
          const qrCode = qrRes?.data?.qr || null;

          if (qrCode) {
            lastQrFetchAtRef.current = Date.now();
            setQr(qrCode);
            qrRef.current = qrCode;
            clearGeneratePoll();
          }

          setViewState(qrCode ? 'qr_ready' : 'qr_setup');
        } else {
          setViewState('qr_ready');
        }
      } else if (st === 'connecting') {
        setViewState('connecting');
        setQr(null);
        qrRef.current = null;
      } else if (st === 'error') {
        setViewState('error');
        setQr(null);
        qrRef.current = null;
        clearGeneratePoll();
      } else {
        // disconnected or null status — go directly to QR setup
        setViewState('qr_setup');
        setQr(null);
        qrRef.current = null;
        lastQrFetchAtRef.current = 0;
        clearGeneratePoll();
      }
    } catch {
      setViewState('qr_setup');
    }
  }, [clearGeneratePoll]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, STATUS_POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      clearGeneratePoll();
    };
  }, [clearGeneratePoll, fetchStatus]);

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setActionLoading(action);
    setError('');
    try {
      await fn();
      await fetchStatus();
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleGenerateQR = async () => {
    setIsInitiating(true);
    setError('');
    setQr(null);
    qrRef.current = null;
    lastQrFetchAtRef.current = 0;
    clearGeneratePoll();
    try {
      await whatsappApi.reconnect();
      await fetchStatus();

      // Poll until QR appears
      let tries = 0;
      generatePollRef.current = setInterval(async () => {
        tries++;
        await fetchStatus();
        if (tries > 12) {
          clearGeneratePoll();
        }
      }, 1500);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Failed to generate QR');
      clearGeneratePoll();
    } finally {
      setIsInitiating(false);
    }
  };

  const handleToggleSafeMode = async () => {
    if (!status?.instanceId) return;
    setSafeModeLoading(true);
    try {
      if (safeModeStatus?.enabled) {
        await safeModeApi.disable(status.instanceId);
      } else {
        await safeModeApi.enable(status.instanceId, 1);
      }
      const smRes = await safeModeApi.getStatus(status.instanceId);
      setSafeModeStatus(smRes.data);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Failed to toggle Safe Mode');
    } finally {
      setSafeModeLoading(false);
    }
  };

  const isConnected = viewState === 'connected';

  return (
    <>
      <Header title="WhatsApp" subtitle="Manage your WhatsApp connection" />
      <div className="page-content">
        {error && (
          <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        {/* ── Loading ── */}
        {viewState === 'loading' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            <SkeletonStatusCard />
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <Shimmer width={56} height={56} radius={28} />
              <Shimmer width="55%" height={18} radius={6} />
              <Shimmer width="75%" height={12} radius={4} />
              <Shimmer width="60%" height={12} radius={4} />
            </div>
          </div>
        )}

        {/* ── QR Setup (disconnected, no session) ── */}
        {viewState === 'qr_setup' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              backgroundColor: 'rgba(51, 217, 81, 0.1)',
              color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
              border: '2px solid rgba(51, 217, 81, 0.25)',
            }}>
              <QrCode size={38} />
            </div>
            <h2 className="font-serif font-bold" style={{ fontSize: 24, marginBottom: 8, color: 'var(--color-text)' }}>
              Connect WhatsApp Account
            </h2>
            <p className="text-secondary" style={{ maxWidth: 380, marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
              Scan the QR code with your WhatsApp app to link your phone number and start sending messages through Blastup.
            </p>

            <button
              id="wa-generate-qr"
              className="btn btn-primary"
              onClick={handleGenerateQR}
              disabled={isInitiating}
              style={{ minWidth: 200, justifyContent: 'center', height: 44, fontSize: 14 }}
            >
              {isInitiating
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating QR...</>
                : <><QrCode size={16} /> Generate QR Code</>
              }
            </button>

            <p className="text-secondary" style={{ fontSize: 12, marginTop: 16 }}>
              On your phone: <strong>WhatsApp → Settings → Linked Devices → Link a Device</strong>
            </p>
          </div>
        )}

        {/* ── QR Ready (scan it) ── */}
        {viewState === 'qr_ready' && qr && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', textAlign: 'center' }}>
            <h2 className="font-serif font-bold" style={{ fontSize: 22, marginBottom: 6 }}>
              Scan QR Code
            </h2>
            <p className="text-secondary" style={{ marginBottom: 24, fontSize: 13 }}>
              Open WhatsApp → <strong>Settings → Linked Devices → Link a Device</strong>
            </p>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              border: '1px solid var(--color-border)',
              marginBottom: 16,
              display: 'inline-block',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="WhatsApp QR Code" style={{ width: 240, height: 240, display: 'block' }} />
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: 'var(--color-text-secondary)',
              backgroundColor: 'rgba(51, 217, 81, 0.08)',
              border: '1px solid rgba(51, 217, 81, 0.2)',
              borderRadius: 20, padding: '4px 12px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-primary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              Waiting for scan · QR refreshes every 60s
            </div>
          </div>
        )}

        {/* ── Connecting ── */}
        {viewState === 'connecting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 20px', textAlign: 'center' }}>
            <Loader2 size={48} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
            <h2 className="font-serif font-bold" style={{ fontSize: 22, marginBottom: 8 }}>Connecting...</h2>
            <p className="text-secondary" style={{ fontSize: 13 }}>
              Establishing WhatsApp connection. This may take a few seconds.
            </p>
          </div>
        )}

        {/* ── Connected (status + management buttons) ── */}
        {isConnected && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {/* Status Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Connection Status</span>
                <span className="badge badge-success">
                  <span className="status-dot connected" />
                  {statusLabels[status?.status] || 'Connected'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Phone Number', value: status?.phone ? `+${status.phone}` : '—' },
                  { label: 'Display Name', value: status?.pushName || '—' },
                  { label: 'Platform', value: status?.platform || 'WhatsApp Multi-Device' },
                  { label: 'Total Chats', value: status?.totalChats?.toLocaleString() || '0' },
                  { label: 'Last Connected', value: status?.lastConnectedAt ? new Date(status.lastConnectedAt).toLocaleString() : '—' },
                  { label: 'Last Sync', value: status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-secondary">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              {/* Management Buttons — only when connected */}
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button
                  id="wa-reconnect"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAction('reconnect', whatsappApi.reconnect)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'reconnect' ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <RefreshCw size={12} />}
                  Reconnect
                </button>

                <button
                  id="wa-logout"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAction('logout', whatsappApi.logout)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'logout' ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <LogOut size={12} />}
                  Logout WA
                </button>

                <button
                  id="wa-delete-session"
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setShowDeleteModal(true)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'delete' ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={12} />}
                  Delete Session
                </button>
              </div>
            </div>

            {/* Connected Banner */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 20px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-serif font-bold" style={{ fontSize: 18, marginBottom: 6 }}>WhatsApp Active</h3>
              <p className="text-secondary" style={{ fontSize: 13, maxWidth: 280 }}>
                Your phone is linked and ready to process automated broadcasts and messages.
              </p>
            </div>

            {/* Safe Mode Panel */}
            <div className="card" style={{ 
              background: safeModeStatus?.enabled ? 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.08) 100%)' : 'var(--color-bg-secondary)',
              border: safeModeStatus?.enabled ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--color-border)'
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: safeModeStatus?.enabled ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--color-bg-tertiary)',
                    color: safeModeStatus?.enabled ? 'white' : 'var(--color-text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {safeModeStatus?.enabled ? <Shield size={20} /> : <ShieldOff size={20} />}
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ fontSize: 16 }}>Safe Mode</h3>
                    <p className="text-xs text-secondary">
                      {safeModeStatus?.enabled ? 'Anti-ban protection is ACTIVE' : 'Anti-ban protection is INACTIVE'}
                    </p>
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${safeModeStatus?.enabled ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleToggleSafeMode}
                  disabled={safeModeLoading}
                  style={{
                    color: safeModeStatus?.enabled ? '#ef4444' : undefined,
                    borderColor: safeModeStatus?.enabled ? 'rgba(239,68,68,0.3)' : undefined
                  }}
                >
                  {safeModeLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {safeModeStatus?.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {safeModeStatus?.enabled && (
                <div style={{ background: 'var(--color-bg-primary)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Zap size={14} style={{ color: '#f59e0b' }} /> Tier {safeModeStatus.tier}
                    </span>
                    <span className="text-xs text-secondary">Day {safeModeStatus.day} of warm-up</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                      <div className="text-xs text-secondary mb-1">Daily Cap</div>
                      <div className="font-semibold text-sm">
                        {safeModeStatus.counters?.sentToday || 0} / {safeModeStatus.limits?.dailyLimit || 0}
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                      <div className="text-xs text-secondary mb-1">New Chats Today</div>
                      <div className="font-semibold text-sm">
                        {safeModeStatus.counters?.newChatsToday || 0} / {safeModeStatus.limits?.maxNewChatsPerDay || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {viewState === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 20px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <QrCode size={28} />
            </div>
            <h3 className="font-serif font-bold" style={{ fontSize: 20, marginBottom: 8 }}>Connection Error</h3>
            <p className="text-secondary" style={{ fontSize: 13, marginBottom: 24 }}>
              WhatsApp encountered an error. Try reconnecting.
            </p>
            <button
              id="wa-retry"
              className="btn btn-primary"
              onClick={handleGenerateQR}
              disabled={isInitiating}
              style={{ minWidth: 160, justifyContent: 'center' }}
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete WhatsApp Session"
        description="This will disconnect WhatsApp and delete all synced chats, contacts, and messages from the database. You will need to re-scan the QR code to reconnect."
        variant="danger"
        confirmText="Delete & Reset"
        onConfirm={() => handleAction('delete', whatsappApi.deleteSession)}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
