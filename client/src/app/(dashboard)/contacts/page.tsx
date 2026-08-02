'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { contactsApi } from '@/lib/api';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { Search, Users, Phone } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await contactsApi.list({ page, limit: 50, search: search || undefined });
      setContacts(res.data);
      setPagination(res.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <>
      <Header title="Contacts" subtitle={`${pagination?.total || 0} contacts`} />
      <div className="page-content">
        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <div className="search-wrapper" style={{ maxWidth: 320 }}>
            <Search className="search-icon" />
            <input
              id="contacts-search"
              type="text"
              className="search-input"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="table-container">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={3} />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <Users />
            <p>No contacts found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>WhatsApp ID</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.jid} id={`contact-${contact.jid}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="chat-avatar" style={{ width: 36, height: 36, fontSize: 'var(--text-sm)' }}>
                          {contact.profilePicUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={contact.profilePicUrl} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            getInitials(contact.name || contact.pushName)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{contact.name || contact.pushName || '—'}</div>
                          {contact.pushName && contact.name && contact.name !== contact.pushName && (
                            <div className="text-xs text-secondary">{contact.pushName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Phone size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                        <span className="text-sm">{contact.phone}</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: 'var(--text-xs)' }}>{contact.jid}</code>
                    </td>
                    <td>
                      {contact.isBusiness ? (
                        <span className="badge badge-info">Business</span>
                      ) : (
                        <span className="badge badge-neutral">Personal</span>
                      )}
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
              Showing {contacts.length} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button id="contacts-prev" className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button id="contacts-next" className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
