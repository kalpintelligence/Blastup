'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { campaignsApi } from '@/lib/api';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import {
  BarChart2, CheckCircle, Clock, Eye, AlertCircle, RefreshCw,
  ArrowLeft, Phone, Calendar, Filter, Users, X, Send, CheckCheck
} from 'lucide-react';

export default function CampaignAnalyticsPage() {
  const router = useRouter();
  const routeParams = useParams();
  const campaignId = (routeParams?.id as string) || '';

  const [campaign, setCampaign] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Re-campaign modal state
  const [showRecampaignModal, setShowRecampaignModal] = useState(false);
  const [recampaignFilter, setRecampaignFilter] = useState<'unread' | 'failed' | 'sent' | 'delivered' | 'read'>('unread');
  const [recampaignName, setRecampaignName] = useState('');
  const [recampaignScheduledAt, setRecampaignScheduledAt] = useState('');
  const [recampaigning, setRecampaigning] = useState(false);

  const fetchCampaignAndLogs = async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const [campRes, logsRes] = await Promise.all([
        campaignsApi.get(campaignId),
        campaignsApi.getLogs(campaignId, { page, limit: 50, status: statusFilter }),
      ]);
      setCampaign(campRes.data);
      setLogs(logsRes.data);
      setPagination(logsRes.pagination);
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaign analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignAndLogs();
  }, [campaignId, page, statusFilter]);

  const handleOpenRecampaign = (filter: 'unread' | 'failed' | 'sent' | 'delivered' | 'read' = 'unread') => {
    setRecampaignFilter(filter);
    setRecampaignName(`Follow-Up (${filter.toUpperCase()}): ${campaign?.name || ''}`);
    setRecampaignScheduledAt(new Date().toISOString().slice(0, 16));
    setShowRecampaignModal(true);
  };

  const handleRecampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecampaigning(true);
    try {
      await campaignsApi.reCampaign(campaignId, {
        name: recampaignName,
        filterStatus: recampaignFilter,
        scheduledAt: new Date(recampaignScheduledAt).toISOString(),
      });
      setShowRecampaignModal(false);
      alert('Re-campaign scheduled successfully!');
      router.push('/campaigns');
    } catch (err: any) {
      alert(err?.message || 'Failed to trigger re-campaign');
    } finally {
      setRecampaigning(false);
    }
  };

  const getLogBadge = (status: string) => {
    switch (status) {
      case 'read':
        return <span className="badge badge-success flex items-center gap-1"><Eye size={12} /> Read</span>;
      case 'delivered':
        return <span className="badge badge-info flex items-center gap-1"><CheckCheck size={12} /> Delivered</span>;
      case 'sent':
        return <span className="badge badge-neutral flex items-center gap-1"><CheckCircle size={12} /> Sent</span>;
      case 'failed':
        return <span className="badge badge-danger flex items-center gap-1"><AlertCircle size={12} /> Failed</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const total = campaign?.stats?.total || 0;
  const sent = campaign?.stats?.sent || 0;
  const delivered = campaign?.stats?.delivered || 0;
  const read = campaign?.stats?.read || 0;
  const failed = campaign?.stats?.failed || 0;

  const sentPct = total ? Math.round((sent / total) * 100) : 0;
  const delivPct = total ? Math.round((delivered / total) * 100) : 0;
  const readPct = total ? Math.round((read / total) * 100) : 0;

  return (
    <>
      <Header title="Campaign Analytics" subtitle={campaign ? `Executive Report: "${campaign.name}"` : 'Loading analytics...'} />
      <div className="page-content" style={{ maxWidth: 1100 }}>
        {/* Back navigation */}
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <button
            className="btn btn-secondary btn-sm flex items-center gap-2"
            onClick={() => router.push('/campaigns')}
          >
            <ArrowLeft size={16} />
            <span>Back to Campaigns</span>
          </button>

          {campaign && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-secondary flex items-center gap-1">
                <Calendar size={13} />
                Created: {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
              <span className={`badge ${campaign.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {campaign.status}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger flex items-center gap-2" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Dashboard Analytics KPI Header */}
        {campaign && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
              <div
                className="card"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  padding: 20,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <span className="text-xs font-semibold text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Audience
                  </span>
                  <div style={{ padding: 8, borderRadius: 8, background: 'rgba(99,102,241,0.12)' }}>
                    <Users size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                </div>
                <div className="font-bold text-2xl" style={{ fontSize: 28 }}>{total}</div>
                <div className="text-xs text-secondary" style={{ marginTop: 4 }}>Recipients targeted</div>
              </div>

              <div
                className="card"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  padding: 20,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <span className="text-xs font-semibold text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Dispatched / Sent
                  </span>
                  <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59,130,246,0.12)' }}>
                    <Send size={18} style={{ color: '#3b82f6' }} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="font-bold text-2xl" style={{ fontSize: 28 }}>{sent}</div>
                  <span className="font-bold text-sm" style={{ color: '#3b82f6' }}>{sentPct}%</span>
                </div>
                <div style={{ marginTop: 8, height: 5, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#3b82f6', borderRadius: 3, width: `${sentPct}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>

              <div
                className="card"
                style={{
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(6,182,212,0.02) 100%)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  padding: 20,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <span className="text-xs font-semibold text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Delivered
                  </span>
                  <div style={{ padding: 8, borderRadius: 8, background: 'rgba(6,182,212,0.12)' }}>
                    <CheckCheck size={18} style={{ color: '#06b6d4' }} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="font-bold text-2xl" style={{ fontSize: 28 }}>{delivered}</div>
                  <span className="font-bold text-sm" style={{ color: '#06b6d4' }}>{delivPct}%</span>
                </div>
                <div style={{ marginTop: 8, height: 5, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#06b6d4', borderRadius: 3, width: `${delivPct}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>

              <div
                className="card"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  padding: 20,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <span className="text-xs font-semibold text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Read Rate
                  </span>
                  <div style={{ padding: 8, borderRadius: 8, background: 'rgba(34,197,94,0.12)' }}>
                    <Eye size={18} style={{ color: '#22c55e' }} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="font-bold text-2xl" style={{ fontSize: 28 }}>{read}</div>
                  <span className="font-bold text-sm" style={{ color: '#22c55e' }}>{readPct}%</span>
                </div>
                <div style={{ marginTop: 8, height: 5, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#22c55e', borderRadius: 3, width: `${readPct}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </div>

            {/* Campaign Template Box */}
            <div className="card" style={{ background: 'var(--color-bg-secondary)', padding: 16 }}>
              <div className="text-xs text-secondary font-semibold" style={{ marginBottom: 4 }}>MESSAGE TEMPLATE SENT</div>
              <div className="text-sm font-mono" style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
                {campaign.templateText}
              </div>
            </div>
          </div>
        )}

        {/* Filter and Re-campaign action bar */}
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: 16 }}>
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-secondary" />
            <span className="text-sm font-semibold">Filter Recipients:</span>
            <div className="flex gap-2">
              {[
                { key: 'all', label: `All (${total})` },
                { key: 'sent', label: `Sent (${sent})` },
                { key: 'delivered', label: `Delivered (${delivered})` },
                { key: 'read', label: `Read (${read})` },
                { key: 'failed', label: `Failed (${failed})` },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`btn btn-sm ${statusFilter === item.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setStatusFilter(item.key); setPage(1); }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-accent flex items-center gap-2"
            onClick={() => handleOpenRecampaign(statusFilter === 'all' ? 'unread' : statusFilter as any)}
            id="recampaign-btn"
          >
            <RefreshCw size={15} />
            <span>Re-Campaign Target Filter ({statusFilter.toUpperCase()})</span>
          </button>
        </div>

        {/* Recipient Logs Table */}
        {loading ? (
          <div className="table-container">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={4} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Users />
            <p>No recipient logs found for status "{statusFilter}".</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Phone Number</th>
                  <th>Delivery Status</th>
                  <th>Sent Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const contactName = log.contactId?.name || log.contactId?.pushName || 'WhatsApp User';
                  return (
                    <tr key={log._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="chat-avatar" style={{ width: 34, height: 34, fontSize: 'var(--text-xs)' }}>
                            {log.contactId?.profilePicUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={log.contactId.profilePicUrl} alt={contactName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                              getInitials(contactName)
                            )}
                          </div>
                          <div className="font-medium text-sm">{contactName}</div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Phone size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                          <span className="text-sm font-mono">{log.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          {getLogBadge(log.status)}
                          {log.errorMessage && (
                            <span className="text-xs text-danger flex items-center gap-1">
                              <AlertCircle size={10} /> {log.errorMessage}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-secondary">
                          {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <span className="text-xs text-secondary">
              Showing {logs.length} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Re-campaign Modal */}
      {showRecampaignModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="card" style={{ width: '100%', maxWidth: 500, background: 'var(--color-surface, #ffffff)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <RefreshCw className="text-accent" size={20} />
                <h3 className="font-semibold text-lg">Launch Targeted Re-Campaign</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRecampaignModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecampaignSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Re-Campaign Name</label>
                <input
                  type="text"
                  className="input"
                  value={recampaignName}
                  onChange={(e) => setRecampaignName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Filter Target Subset</label>
                <select
                  className="input"
                  value={recampaignFilter}
                  onChange={(e) => setRecampaignFilter(e.target.value as any)}
                >
                  <option value="unread">Unread Users (Pending / Sent / Delivered without Read)</option>
                  <option value="failed">Failed Delivery Users</option>
                  <option value="delivered">Delivered Users</option>
                  <option value="read">Read Users (Follow-up promotion)</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Dispatch Date & Time</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={recampaignScheduledAt}
                  onChange={(e) => setRecampaignScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecampaignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={recampaigning}>
                  {recampaigning ? 'Scheduling...' : 'Launch Re-Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
