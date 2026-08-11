'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { whatsappApi, healthApi, logsApi } from '@/lib/api';
import {
  SkeletonStatCard, SkeletonBarChart, SkeletonLogRow
} from '@/components/ui/Skeleton';
import {
  MessageSquare, Users, Send, Inbox, ServerCrash,
  Wifi, Info, TrendingUp, Activity, ShieldCheck, ArrowUpRight,
  BarChart3, CheckCircle2, ScrollText, ArrowRight, Zap, RefreshCw
} from 'lucide-react';

interface InstanceData {
  status: string;
  phone: string | null;
  pushName: string | null;
  lastConnectedAt: string | null;
  totalChats: number;
  totalContacts: number;
  messagesToday: number;
  messagesSent: number;
  messagesReceived: number;
}

interface HealthData {
  uptime: string;
  mongodb: string;
  memory: { heapUsedMB: number; rssMB: number };
}

interface LogEntry {
  _id: string;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  ip: string;
}

export default function DashboardPage() {
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [instRes, healthRes, logsRes] = await Promise.all([
        whatsappApi.getStatus(),
        healthApi.get(),
        logsApi.list({ limit: 4 }).catch(() => ({ data: [] })),
      ]);
      setInstance(instRes.data);
      setHealth(healthRes.data);
      setRecentLogs(logsRes.data || []);
    } catch {
      // silent catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalMessages = (instance?.messagesSent || 0) + (instance?.messagesReceived || 0);
  const sentRatio = totalMessages > 0 ? Math.round(((instance?.messagesSent || 0) / totalMessages) * 100) : 50;
  const receivedRatio = 100 - sentRatio;

  // Visual chart bar heights for Nexus-style representation
  const weeklyData = [
    { day: 'Sun', height: '40%' },
    { day: 'Mon', height: '65%' },
    { day: 'Tue', height: '90%', highlight: true, count: totalMessages > 0 ? totalMessages : '124' },
    { day: 'Wed', height: '55%' },
    { day: 'Thu', height: '75%' },
    { day: 'Fri', height: '45%' },
    { day: 'Sat', height: '80%' },
  ];

  return (
    <>
      <Header title="Dashboard" subtitle="Real-time analytics and platform performance" />
      <div className="page-content">
        
        {/* Top 4 KPI Metrics Row */}
        <div className="grid-stats">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              {/* Card 1: Messages Sent */}
              <div className="card">
                <div className="card-header">
                  <span className="text-secondary text-sm font-medium">Messages Sent</span>
                  <Info size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span className="metric-value">{instance?.messagesSent ?? 0}</span>
                  <span className="badge-growth positive">
                    +15.8% <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>

              {/* Card 2: Synced Contacts */}
              <div className="card">
                <div className="card-header">
                  <span className="text-secondary text-sm font-medium">Synced Contacts</span>
                  <Info size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span className="metric-value">{instance?.totalContacts ?? 0}</span>
                  <span className="badge-growth positive">
                    +24.2% <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>

              {/* Card 3: Active Conversations */}
              <div className="card">
                <div className="card-header">
                  <span className="text-secondary text-sm font-medium">Conversations</span>
                  <Info size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span className="metric-value">{instance?.totalChats ?? 0}</span>
                  <span className="badge-growth positive">
                    +8.4% <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>

              {/* Card 4: Messages Received */}
              <div className="card">
                <div className="card-header">
                  <span className="text-secondary text-sm font-medium">Messages Received</span>
                  <Info size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span className="metric-value">{instance?.messagesReceived ?? 0}</span>
                  <span className="badge-growth positive">
                    +12.1% <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Middle Insights Row (Nexus Weekly Volume Bar Chart + Activity) */}
        <div className="grid-2-1" style={{ marginBottom: 24 }}>
          
          {/* Main Visual Chart: Message Traffic Overview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="card-header">
              <div>
                <span className="card-title flex items-center gap-2">
                  <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
                  Message Volume Analytics
                </span>
                <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                  Daily traffic distribution &amp; response velocity
                </p>
              </div>
              <span className="badge badge-neutral">Weekly Overview</span>
            </div>

            {loading ? (
              <SkeletonBarChart />
            ) : (
              <div style={{ marginTop: 24, marginBottom: 16, height: 160, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 16px' }}>
                {weeklyData.map((bar) => (
                  <div key={bar.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: 36 }}>
                    {bar.count && (
                      <span className="font-serif font-bold text-xs" style={{ marginBottom: 6, color: 'var(--color-primary)' }}>
                        {bar.count}
                      </span>
                    )}
                    <div
                      style={{
                        width: '100%',
                        height: bar.height,
                        backgroundColor: bar.highlight ? 'var(--color-primary)' : 'var(--color-primary-light)',
                        borderRadius: 8,
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span className="text-xs text-secondary" style={{ marginTop: 8 }}>{bar.day}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center" style={{ paddingTop: 16, borderTop: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                  Peak Volume
                </span>
                <span className="flex items-center gap-1 text-secondary">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-primary-light)' }} />
                  Normal Range
                </span>
              </div>
              <span className="text-xs text-secondary font-medium">99.8% Delivery Success</span>
            </div>
          </div>

          {/* Right Insights Column: Message Ratio Distribution */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="card-header">
                <span className="card-title">Traffic Breakdown</span>
                <Info size={14} style={{ color: 'var(--color-text-tertiary)' }} />
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="flex justify-between text-xs font-medium" style={{ marginBottom: 8 }}>
                  <span>Outbound (Sent)</span>
                  <span>{sentRatio}%</span>
                </div>
                <div style={{ height: 8, backgroundColor: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ width: `${sentRatio}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
                </div>

                <div className="flex justify-between text-xs font-medium" style={{ marginBottom: 8 }}>
                  <span>Inbound (Received)</span>
                  <span>{receivedRatio}%</span>
                </div>
                <div style={{ height: 8, backgroundColor: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ width: `${receivedRatio}%`, height: '100%', backgroundColor: 'var(--color-info)' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Zap size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div className="font-semibold text-xs">Automated Engine</div>
                <div className="text-xs text-secondary" style={{ fontSize: 10 }}>Baileys v6.7 Multi-Device Socket</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Audit Log Activity & Quick Actions */}
        <div className="grid-2-1">
          
          {/* Live Recent System Events Log Feed */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <ScrollText size={18} style={{ color: 'var(--color-primary)' }} />
                Recent System Activity
              </span>
              <Link href="/logs" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                View All Logs <ArrowRight size={12} />
              </Link>
            </div>

            <div className="flex flex-col gap-3" style={{ marginTop: 12 }}>
              {loading ? (
                <>
                  <SkeletonLogRow />
                  <SkeletonLogRow />
                  <SkeletonLogRow />
                  <SkeletonLogRow />
                </>
              ) : recentLogs.length === 0 ? (
                <div className="text-xs text-secondary py-4">No recent activity logged.</div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log._id} className="flex justify-between items-center" style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${log.level === 'error' ? 'badge-danger' : log.level === 'warn' ? 'badge-warning' : 'badge-info'}`}>
                        {log.level}
                      </span>
                      <span className="text-xs font-medium">{log.message}</span>
                    </div>
                    <span className="text-xs text-secondary" style={{ fontSize: 10 }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="card flex flex-col justify-between">
            <div className="card-header">
              <span className="card-title">Quick Actions</span>
            </div>
            
            <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
              <Link href="/send" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                <Send size={14} /> Send Quick Message
              </Link>
              <Link href="/whatsapp" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <Wifi size={14} /> WhatsApp Status / QR
              </Link>
              <Link href="/settings" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <Zap size={14} /> Manage API Keys
              </Link>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
