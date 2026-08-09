'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { chatbotLeadsApi } from '@/lib/api';
import { Users, ChevronDown, ChevronUp, Trash2, Download, Filter, RefreshCw, MessageSquare, Globe, Calendar, Mail, Phone } from 'lucide-react';

interface Lead {
  _id: string;
  sessionId: string;
  domain: string;
  pageUrl?: string;
  capturedData: { name?: string; email?: string; phone?: string; message?: string };
  messages: Array<{ sender: 'user' | 'bot'; text: string; timestamp: string }>;
  createdAt: string;
}

export default function ChatbotLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState('');
  const [domains, setDomains] = useState<string[]>([]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await chatbotLeadsApi.list({ page, limit: 20, domain: filterDomain || undefined });
      const body = res as any;
      const data: Lead[] = body.data ?? [];
      setLeads(data);
      setTotal(body.pagination?.total ?? data.length);
      // Collect unique domains for filter
      const uniqueDomains = Array.from(new Set(data.map((l: Lead) => l.domain).filter(Boolean)));
      setDomains(prev => Array.from(new Set([...prev, ...uniqueDomains])));
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, [page, filterDomain]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await chatbotLeadsApi.delete(id);
    setLeads(prev => prev.filter(l => l._id !== id));
    setTotal(t => t - 1);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Domain', 'Page URL', 'Messages', 'Date'],
      ...leads.map(l => [
        l.capturedData.name || '',
        l.capturedData.email || '',
        l.capturedData.phone || '',
        l.domain,
        l.pageUrl || '',
        l.messages.length.toString(),
        new Date(l.createdAt).toLocaleString(),
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'chatbot-leads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (dt: string) => new Date(dt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (dt: string) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Header title="Chatbot Leads" subtitle="Visitor conversations and captured contact information" />
      <div className="page-content" style={{ maxWidth: 960 }}>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Leads', value: total, icon: Users, color: '#25D366' },
            { label: 'Unique Domains', value: domains.length, icon: Globe, color: '#6366f1' },
            { label: 'This Page', value: leads.length, icon: MessageSquare, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--color-bg-secondary)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
                <div className="text-xs text-secondary">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <Filter size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
            <select className="input" style={{ flex: 1 }} value={filterDomain} onChange={e => { setFilterDomain(e.target.value); setPage(1); }}>
              <option value="">All Domains</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={fetchLeads}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={handleExportCSV} disabled={leads.length === 0}>
            <Download size={13} /> Export CSV
          </button>
        </div>

        {/* Lead Cards */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card" style={{ background: 'var(--color-bg-secondary)', height: 80, opacity: 0.5 }} />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
            <Users size={44} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 14px' }} />
            <h3 className="font-semibold" style={{ marginBottom: 8 }}>No leads yet</h3>
            <p className="text-secondary text-sm" style={{ maxWidth: 380, margin: '0 auto' }}>
              Enable <strong>Lead Collection</strong> in Chatbot Settings, then embed your widget on a whitelisted domain to start capturing contacts.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leads.map(lead => (
              <div key={lead._id} className="card" style={{ background: 'var(--color-bg-secondary)', padding: 0, overflow: 'hidden' }}>
                {/* Lead row */}
                <div
                  style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
                  onClick={() => setExpandedId(expandedId === lead._id ? null : lead._id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {(lead.capturedData.name || lead.domain || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {lead.capturedData.name || <span className="text-secondary" style={{ fontWeight: 400 }}>Anonymous Visitor</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                        {lead.capturedData.email && (
                          <span className="text-xs text-secondary flex items-center gap-1">
                            <Mail size={10} /> {lead.capturedData.email}
                          </span>
                        )}
                        {lead.capturedData.phone && (
                          <span className="text-xs text-secondary flex items-center gap-1">
                            <Phone size={10} /> {lead.capturedData.phone}
                          </span>
                        )}
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <Globe size={10} /> {lead.domain}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(37,211,102,0.1)', color: '#25D366', fontWeight: 600, marginBottom: 4 }}>
                        {lead.messages.length} msg{lead.messages.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-secondary flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                        <Calendar size={10} /> {fmt(lead.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(lead._id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', opacity: 0.7, padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedId === lead._id ? <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />}
                    </div>
                  </div>
                </div>

                {/* Expanded conversation */}
                {expandedId === lead._id && (
                  <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', padding: 16 }}>
                    {lead.pageUrl && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 12, padding: '4px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6, display: 'inline-block' }}>
                        🔗 {lead.pageUrl}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                      {lead.messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '70%', padding: '7px 12px',
                            borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            background: msg.sender === 'user' ? 'rgba(37,211,102,0.12)' : 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            fontSize: 12.5, lineHeight: 1.4,
                          }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 4, textAlign: 'right' }}>
                              {msg.sender === 'bot' ? '🤖 Bot' : '👤 Visitor'} · {fmtTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {lead.messages.length === 0 && (
                        <p className="text-xs text-secondary" style={{ textAlign: 'center', padding: 16 }}>No messages recorded</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span className="text-sm text-secondary" style={{ padding: '8px 12px' }}>Page {page} of {Math.ceil(total / 20)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
