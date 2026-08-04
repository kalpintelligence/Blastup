'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { campaignsApi } from '@/lib/api';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { Megaphone, Plus, BarChart2, Calendar, Users, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await campaignsApi.list({ page, limit: 20, status: statusFilter || undefined });
      setCampaigns(res.data);
      setPagination(res.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignsApi.delete(id);
      fetchCampaigns();
    } catch {
      alert('Failed to delete campaign');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success flex items-center gap-1"><CheckCircle size={12} /> Completed</span>;
      case 'processing':
        return <span className="badge badge-info flex items-center gap-1"><Clock size={12} /> Processing</span>;
      case 'scheduled':
        return <span className="badge badge-warning flex items-center gap-1"><Calendar size={12} /> Scheduled</span>;
      case 'failed':
        return <span className="badge badge-danger flex items-center gap-1"><AlertCircle size={12} /> Failed</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <>
      <Header title="Campaigns" subtitle="Manage bulk WhatsApp broadcasts, templates & schedules" />
      <div className="page-content">
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: 20 }}>
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <select
              id="campaign-status-filter"
              className="input"
              style={{ width: 180, height: 38, fontSize: 'var(--text-sm)' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <Link href="/campaigns/new" className="btn btn-primary flex items-center gap-2" id="create-campaign-btn">
            <Plus size={16} />
            <span>Create Campaign</span>
          </Link>
        </div>

        {loading ? (
          <div className="table-container">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={5} />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <Megaphone />
            <p>No campaigns found.</p>
            <Link href="/campaigns/new" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Target Groups</th>
                  <th>Scheduled / Created</th>
                  <th>Status</th>
                  <th>Delivery Stats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id} id={`campaign-${c._id}`}>
                    <td>
                      <div>
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-secondary truncate" style={{ maxWidth: 240 }}>
                          {c.templateText}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {c.targetGroups && c.targetGroups.length > 0 ? (
                          c.targetGroups.map((g: string) => (
                            <span key={g} className="badge badge-neutral" style={{ fontSize: 'var(--text-xs)' }}>
                              {g}
                            </span>
                          ))
                        ) : (
                          <span className="badge badge-accent" style={{ fontSize: 'var(--text-xs)' }}>
                            All Contacts
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">
                        <div>{new Date(c.scheduledAt).toLocaleDateString()}</div>
                        <div className="text-secondary">{new Date(c.scheduledAt).toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      <div className="text-xs" style={{ minWidth: 140 }}>
                        <div className="flex justify-between" style={{ marginBottom: 2 }}>
                          <span>Sent: {c.stats?.sent || 0}/{c.stats?.total || 0}</span>
                          <span className="font-semibold text-accent">
                            {c.stats?.total ? Math.round(((c.stats?.sent || 0) / c.stats.total) * 100) : 0}%
                          </span>
                        </div>
                        <div className="flex gap-2 text-secondary" style={{ fontSize: 10 }}>
                          <span>Delivered: {c.stats?.delivered || 0}</span>
                          <span>Read: {c.stats?.read || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/campaigns/${c._id}/analytics`}
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                          id={`analytics-btn-${c._id}`}
                        >
                          <BarChart2 size={14} />
                          <span>Analytics</span>
                        </Link>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDelete(c._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <span className="text-xs text-secondary">
              Showing {campaigns.length} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
