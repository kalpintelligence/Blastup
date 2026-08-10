'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { chatbotLeadsApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import {
  Users, Search, Filter, MessageSquare, Send, CheckCheck,
  Phone, Mail, Globe, Calendar, Trash2, Download, RefreshCw,
  ChevronRight, Circle, Clock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Lead {
  _id: string;
  sessionId: string;
  domain: string;
  pageUrl?: string;
  capturedData: { name?: string; email?: string; phone?: string; message?: string };
  messages: Array<{ sender: 'user' | 'bot' | 'agent'; text: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [isBotOnline, setIsBotOnline] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead?.messages]);

  // Fetch all leads
  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const res = await chatbotLeadsApi.list({ page: 1, limit: 100, domain: filterDomain || undefined });
      const body = res as any;
      const data: Lead[] = body.data ?? [];
      setLeads(data);
      
      // Select the first lead by default if none selected
      if (data.length > 0 && !selectedLead) {
        setSelectedLead(data[0]);
      } else if (selectedLead) {
        // Refresh the selected lead if it's in the list
        const updated = data.find(l => l._id === selectedLead._id);
        if (updated) setSelectedLead(updated);
      }

      // Collect unique domains for filter
      const uniqueDomains = Array.from(new Set(data.map((l: Lead) => l.domain).filter(Boolean)));
      setDomains(prev => Array.from(new Set([...prev, ...uniqueDomains])));
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  }, [filterDomain, selectedLead]);

  useEffect(() => {
    fetchLeads();
  }, [filterDomain]);

  // Socket real-time updates
  useEffect(() => {
    if (!socket) return;

    // Join room or register interest
    socket.emit('join', 'default');

    socket.on('chatbot:lead:message', (payload: any) => {
      setLeads(prevLeads => {
        // Check if lead already exists
        const exists = prevLeads.some(l => l._id === payload.leadId);
        
        if (exists) {
          return prevLeads.map(l => {
            if (l._id === payload.leadId) {
              const updatedMessages = [...l.messages];
              // Avoid duplicate messages if received multiple times
              const isDuplicate = updatedMessages.some(m => 
                m.text === payload.message.text && 
                m.sender === payload.message.sender && 
                Math.abs(new Date(m.timestamp).getTime() - new Date(payload.message.timestamp).getTime()) < 1000
              );
              
              if (!isDuplicate) {
                updatedMessages.push(payload.message);
              }

              const updatedLead = {
                ...l,
                messages: updatedMessages,
                capturedData: { ...l.capturedData, ...payload.capturedData },
                updatedAt: payload.message.timestamp
              };

              // Update selected lead if it is the active one
              if (selectedLead && selectedLead._id === l._id) {
                setSelectedLead(updatedLead);
              }

              return updatedLead;
            }
            return l;
          }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else {
          // New lead received! Reload to fetch clean metadata or insert dynamically
          const newLead: Lead = {
            _id: payload.leadId,
            sessionId: payload.sessionId,
            domain: payload.domain,
            capturedData: payload.capturedData || {},
            messages: [payload.message],
            createdAt: payload.message.timestamp,
            updatedAt: payload.message.timestamp
          };
          
          if (selectedLead === null) {
            setSelectedLead(newLead);
          }

          return [newLead, ...prevLeads];
        }
      });
    });

    socket.on('chatbot:status', (payload: { instanceId: string; enabled: boolean }) => {
      setIsBotOnline(payload.enabled);
    });

    return () => {
      socket.off('chatbot:lead:message');
      socket.off('chatbot:status');
    };
  }, [socket, selectedLead]);

  // Handle send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedLead || sending) return;

    const textToSend = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      const res = await chatbotLeadsApi.reply(selectedLead._id, textToSend);
      const newMsg = {
        sender: 'agent' as const,
        text: textToSend,
        timestamp: new Date().toISOString(),
      };

      // Update local state immediately
      const updatedLead = {
        ...selectedLead,
        messages: [...selectedLead.messages, newMsg],
      };
      
      setSelectedLead(updatedLead);
      setLeads(prev => prev.map(l => l._id === selectedLead._id ? updatedLead : l));
    } catch (err: any) {
      alert(err?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this lead and all of its conversation logs?')) return;
    try {
      await chatbotLeadsApi.delete(id);
      setLeads(prev => prev.filter(l => l._id !== id));
      if (selectedLead?._id === id) {
        setSelectedLead(null);
      }
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  // Export leads to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Domain', 'Page URL', 'Total Messages', 'Date Created'],
      ...leads.map(l => [
        l.capturedData.name || 'Anonymous Visitor',
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
    a.href = url;
    a.download = `chatbot-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDisplayName = (lead: Lead) => {
    return lead.capturedData.name || lead.capturedData.email || lead.capturedData.phone || 'Anonymous Visitor';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  };

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => {
    const name = (lead.capturedData.name || '').toLowerCase();
    const email = (lead.capturedData.email || '').toLowerCase();
    const phone = (lead.capturedData.phone || '').toLowerCase();
    const domain = (lead.domain || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || domain.includes(q);
  });

  return (
    <>
      <Header 
        title="Chatbot Leads Console" 
        subtitle="Real-time website visitor interactions and captured customer records" 
      />
      
      <div className="whatsapp-split-pane" style={{ height: 'calc(100vh - 120px)' }}>
        
        {/* Left Side: Leads List */}
        <div className="chats-sidebar">
          {/* Header Action Strip */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ flex: 1 }}>
              <Search className="search-icon" size={14} />
              <input
                type="text"
                className="search-input"
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportCSV}
              title="Export all to CSV"
              style={{ padding: '8px 10px' }}
            >
              <Download size={14} />
            </button>
          </div>

          {/* Filter Dropdown */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={12} className="text-secondary" />
            <select
              value={filterDomain}
              onChange={e => setFilterDomain(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                outline: 'none',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <option value="">All Domains</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <button
              onClick={fetchLeads}
              className="text-secondary hover:text-primary transition"
              title="Refresh list"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Leads List */}
          <div className="chats-list" style={{ overflowY: 'auto', flex: 1 }}>
            {loadingLeads ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <span>Loading visitor leads...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No matching leads found.</p>
              </div>
            ) : (
              filteredLeads.map(lead => {
                const isActive = selectedLead?._id === lead._id;
                const lastMsg = lead.messages[lead.messages.length - 1];
                const displayName = getDisplayName(lead);
                
                return (
                  <div
                    key={lead._id}
                    className={`chat-row-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedLead(lead)}
                    style={{ position: 'relative' }}
                  >
                    <div className="chat-avatar" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white', fontWeight: 600 }}>
                      {getInitials(displayName)}
                    </div>
                    
                    <div className="chat-info">
                      <div className="chat-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {displayName}
                        </span>
                        {lead.domain && (
                          <span style={{ fontSize: 9, background: 'var(--color-border)', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                            {lead.domain}
                          </span>
                        )}
                      </div>
                      
                      <div className="chat-preview" style={{ fontSize: 12 }}>
                        {lastMsg ? (
                          <span>
                            {lastMsg.sender === 'agent' ? 'You: ' : (lastMsg.sender === 'bot' ? '🤖 ' : '')}
                            {lastMsg.text}
                          </span>
                        ) : (
                          <span className="text-tertiary">No messages</span>
                        )}
                      </div>
                    </div>

                    <div className="chat-meta">
                      {lead.updatedAt && (
                        <div className="chat-time" style={{ fontSize: 10 }}>
                          {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: false })}
                        </div>
                      )}
                      <button
                        onClick={(e) => handleDeleteLead(lead._id, e)}
                        className="text-danger opacity-0 hover:opacity-100 transition absolute right-3 bottom-3"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        title="Delete lead"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        {selectedLead ? (
          <div className="chat-window">
            
            {/* Header */}
            <div className="chat-window-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div 
                  className="chat-avatar" 
                  style={{ 
                    width: 42, 
                    height: 42, 
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 16
                  }}
                >
                  {getInitials(getDisplayName(selectedLead))}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getDisplayName(selectedLead)}
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#10b981' : '#cbd5e1', display: 'inline-block' }} title={isConnected ? 'Console Connected' : 'Disconnected'} />
                  </div>
                  <div className="text-xs text-secondary flex items-center gap-3 style={{ marginTop: 2 }}">
                    {selectedLead.capturedData.email && (
                      <span className="flex items-center gap-1"><Mail size={11} /> {selectedLead.capturedData.email}</span>
                    )}
                    {selectedLead.capturedData.phone && (
                      <span className="flex items-center gap-1"><Phone size={11} /> {selectedLead.capturedData.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedLead.pageUrl && (
                  <a 
                    href={selectedLead.pageUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="badge badge-secondary flex items-center gap-1 text-xs hover:bg-opacity-80 transition"
                    style={{ textDecoration: 'none' }}
                  >
                    <Globe size={11} /> Active page
                  </a>
                )}
                <span className="badge badge-success flex items-center gap-1 text-xs">
                  <Clock size={11} /> Registered: {format(new Date(selectedLead.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="chat-window-messages" style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
              {selectedLead.messages.length === 0 ? (
                <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No messages recorded for this session.</p>
                </div>
              ) : (
                selectedLead.messages.map((msg, idx) => {
                  const isAgent = msg.sender === 'agent';
                  const isBot = msg.sender === 'bot';
                  const isUser = msg.sender === 'user';
                  
                  return (
                    <div
                      key={idx}
                      className={`message-row ${isAgent ? 'from-me' : 'from-them'}`}
                      style={{ marginBottom: 16 }}
                    >
                      <div 
                        className={`message-bubble ${isAgent ? 'from-me' : 'from-them'}`}
                        style={{
                          background: isAgent 
                            ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' 
                            : (isBot ? 'rgba(99, 102, 241, 0.08)' : 'var(--color-bg-secondary)'),
                          border: isAgent ? 'none' : '1px solid var(--color-border)',
                          color: isAgent ? '#ffffff' : 'var(--color-text)',
                          padding: '10px 14px',
                          borderRadius: isAgent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.4 }}>
                          {msg.text}
                        </div>
                        <span 
                          className="message-time-stamp"
                          style={{ 
                            fontSize: 9, 
                            opacity: 0.7, 
                            marginTop: 4, 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: 3,
                            color: isAgent ? '#e0e7ff' : 'var(--color-text-secondary)'
                          }}
                        >
                          {isBot ? '🤖 Bot' : (isAgent ? '👤 You' : '👤 Visitor')} · {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                          {isAgent && <CheckCheck size={12} />}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message Input Composer */}
            <form onSubmit={handleSendReply} className="chat-window-composer" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
              <input
                type="text"
                className="chat-composer-input"
                placeholder={`Type a reply to ${getDisplayName(selectedLead)}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!replyText.trim() || sending}
                style={{ borderRadius: 'var(--radius-pill)', padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <Send size={14} />
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>
            </form>

          </div>
        ) : (
          <div className="chat-welcome-placeholder" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Users size={64} style={{ color: 'var(--color-primary)', marginBottom: 20, opacity: 0.8 }} />
            <h2 className="font-bold text-lg" style={{ marginBottom: 6 }}>Leads Live Console</h2>
            <p className="text-sm text-secondary" style={{ maxWidth: 360, textAlign: 'center', lineHeight: 1.5 }}>
              Select a website visitor lead from the list to view their browsing page, full chatbot transcripts, and step in to reply in real time.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
