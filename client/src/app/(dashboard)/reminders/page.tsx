'use client';

import { FormEvent, useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { remindersApi } from '@/lib/api';
import { CheckCircle2, Clock3, Edit3, ListTodo, MessageCircle, Trash2, X } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

type Task = {
  _id: string; taskId: number; actionType: 'REMINDER' | 'SEND_MESSAGE'; title: string;
  status: string; dueAt: string; timezone: string; contactName?: string; contactPhone?: string;
  contactId?: string; contactJid?: string; messageContent?: string; deliveryStatus: string;
  deliveredAt?: string; retryCount: number; failureReason?: string;
};

const columns = [
  { key: 'todo', label: 'Todo', icon: ListTodo },
  { key: 'in_progress', label: 'In Progress', icon: Clock3 },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const maskPhone = (phone?: string) => phone ? `${phone.slice(0, Math.min(3, phone.length))}******${phone.slice(-4)}` : '—';
const localDate = (value: string) => { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); };

export default function RemindersPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });

  const load = async () => { setLoading(true); try { const result = await remindersApi.list({ page, limit: 12 }); setTasks(result.data); setPagination(result.pagination); } finally { setLoading(false); } };
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [page]);

  const openEdit = (task: Task) => { setEditing(task); setForm({ title: task.title, messageContent: task.messageContent || '', contactName: task.contactName || '', contactPhone: task.contactPhone || '', dueAt: localDate(task.dueAt) }); };
  const save = async (event: FormEvent) => { event.preventDefault(); if (!editing) return; setSaving(true); try { await remindersApi.update(editing.taskId, { ...form, dueAt: new Date(form.dueAt).toISOString() }); setEditing(null); await load(); } finally { setSaving(false); } };
  const cancel = async (task: Task) => { if (!confirm(`Cancel Task #${task.taskId}? It will not be sent.`)) return; await remindersApi.cancel(task.taskId); await load(); };

  return <>
    <Header title="Reminders" subtitle="WhatsApp tasks, reminders and scheduled messages" />
    <div className="page-content">
      {loading && !tasks.length ? <div className="empty-state"><p>Loading tasks…</p></div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))', gap: 18, alignItems: 'start', overflowX: 'auto' }}>
          {columns.map(column => {
            const items = tasks.filter(task => task.status === column.key || (column.key === 'completed' && task.status === 'cancelled'));
            const Icon = column.icon;
            return <section key={column.key} style={{ minWidth: 260, background: 'var(--color-bg-tertiary)', borderRadius: 14, padding: 14 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}><div className="flex items-center gap-2"><Icon size={17}/><strong>{column.label}</strong></div><span className="badge badge-neutral">{items.length}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.length === 0 && <div className="text-sm text-secondary" style={{ padding: 18, textAlign: 'center' }}>No tasks</div>}
                {items.map(task => <article key={task._id} className="card" style={{ padding: 16 }}>
                  <div className="flex items-center justify-between gap-2"><span className={`badge ${task.actionType === 'SEND_MESSAGE' ? 'badge-info' : 'badge-warning'}`}>{task.actionType === 'SEND_MESSAGE' ? <><MessageCircle size={11}/> Send message</> : 'Reminder'}</span><span className="text-xs text-secondary">#{task.taskId}</span></div>
                  <h3 style={{ fontSize: 16, marginTop: 10 }}>{task.title}</h3>
                  {task.contactName && <div className="text-sm" style={{ marginTop: 8 }}><strong>{task.contactName}</strong><div className="text-xs text-secondary">{maskPhone(task.contactPhone)}</div></div>}
                  {task.messageContent && <p className="text-sm" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{task.messageContent}</p>}
                  <div className="text-xs text-secondary" style={{ marginTop: 10 }}>Scheduled: {new Date(task.dueAt).toLocaleString()}<br/>Delivery: <strong>{task.deliveryStatus.replaceAll('_', ' ')}</strong>{task.retryCount ? ` · retry ${task.retryCount}` : ''}</div>
                  {task.failureReason && <div className="text-xs" style={{ color: 'var(--color-danger)', marginTop: 6 }}>{task.failureReason}</div>}
                  {!['sent', 'delivered', 'read'].includes(task.deliveryStatus) && task.status !== 'cancelled' && <div className="flex gap-2" style={{ marginTop: 12 }}><button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => openEdit(task)}><Edit3 size={13}/> Edit</button><button className="btn btn-ghost btn-sm" onClick={() => cancel(task)} title="Cancel"><Trash2 size={14}/></button></div>}
                </article>)}
              </div>
            </section>;
          })}
        </div>}
      <Pagination page={page} pages={pagination.pages} total={pagination.total} pageSize={12} onPageChange={setPage} />
    </div>
    {editing && <div className="modal-overlay" onClick={() => setEditing(null)}><form className="modal-card" onSubmit={save} onClick={event => event.stopPropagation()} style={{ width: 520 }}>
      <div className="modal-header"><span className="modal-title">Edit Task #{editing.taskId}</span><button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(null)}><X size={16}/></button></div>
      <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
        <label className="form-group"><span className="label">Task title</span><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
        {editing.actionType === 'SEND_MESSAGE' && <><label className="form-group"><span className="label">Contact name</span><input className="input" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })}/></label><label className="form-group"><span className="label">Contact number</span><input className="input" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })}/></label><label className="form-group"><span className="label">Message</span><textarea className="input" rows={4} value={form.messageContent} onChange={e => setForm({ ...form, messageContent: e.target.value })}/></label></>}
        <label className="form-group"><span className="label">Scheduled date and time</span><input className="input" type="datetime-local" required value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })}/></label>
      </div>
      <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form></div>}
  </>;
}
