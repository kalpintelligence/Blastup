'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { contactsApi } from '@/lib/api';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { Search, Users, Phone, Upload, Tag, X, Plus, Filter, Pencil, Trash2, Save } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/format';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Import Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importGroupTag, setImportGroupTag] = useState('');
  const [selectedGroupsForImport, setSelectedGroupsForImport] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Edit Modal states
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGroupsText, setEditGroupsText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Bulk Selection & Separate Create Group Modal states
  const [selectedJids, setSelectedJids] = useState<string[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupCreateError, setGroupCreateError] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const [res, groupsRes] = await Promise.all([
        contactsApi.list({ page, limit: 50, search: search || undefined, group: selectedGroup || undefined }),
        contactsApi.getGroups(),
      ]);
      setContacts(res.data);
      setPagination(res.pagination);
      setGroups(groupsRes.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, selectedGroup]);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  // Import handlers
  const handleAddImportGroup = () => {
    if (!importGroupTag.trim()) return;
    const tag = importGroupTag.trim();
    if (!selectedGroupsForImport.includes(tag)) {
      setSelectedGroupsForImport([...selectedGroupsForImport, tag]);
    }
    setImportGroupTag('');
  };

  const handleRemoveImportGroup = (tag: string) => {
    setSelectedGroupsForImport(selectedGroupsForImport.filter((t) => t !== tag));
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);
    setImportMessage(null);

    try {
      const lines = importText.split('\n');
      const parsedContacts: Array<{ phone: string; name?: string }> = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(',');
        if (parts.length >= 2) {
          parsedContacts.push({ name: parts[0].trim(), phone: parts[1].trim() });
        } else {
          parsedContacts.push({ phone: parts[0].trim() });
        }
      }

      const res = await contactsApi.importContacts(parsedContacts, selectedGroupsForImport);
      setImportMessage(`Successfully imported ${res.data.importedCount} contacts!`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportText('');
        setSelectedGroupsForImport([]);
        setImportMessage(null);
        fetchContacts();
      }, 1200);
    } catch (err: any) {
      setImportMessage(err?.message || 'Import failed. Please check format.');
    } finally {
      setImporting(false);
    }
  };

  // Edit handlers
  const handleOpenEdit = (contact: any) => {
    setEditingContact(contact);
    setEditName(contact.name || contact.pushName || '');
    setEditPhone(contact.phone || contact.jid?.split('@')[0] || '');
    setEditGroupsText((contact.groups || []).join(', '));
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const newGroups = editGroupsText.split(',').map((g) => g.trim()).filter(Boolean);
      await contactsApi.update(editingContact.jid, {
        name: editName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        groups: newGroups,
      });
      setEditingContact(null);
      fetchContacts();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update contact');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (contact: any) => {
    if (!confirm(`Delete contact "${contact.name || contact.pushName || contact.phone}"? This cannot be undone.`)) return;
    try {
      await contactsApi.delete(contact.jid);
      fetchContacts();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete contact');
    }
  };

  // Group creation & selection handlers
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedJids.includes(c.jid));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedJids([]);
    } else {
      setSelectedJids(contacts.map((c) => c.jid));
    }
  };

  const handleToggleSelectJid = (jid: string) => {
    if (selectedJids.includes(jid)) {
      setSelectedJids(selectedJids.filter((id) => id !== jid));
    } else {
      setSelectedJids([...selectedJids, jid]);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    setGroupCreateError(null);
    try {
      const targetJids = selectedJids.length > 0 ? selectedJids : contacts.map((c) => c.jid);
      await contactsApi.updateGroups(targetJids, [newGroupName.trim()], 'add');
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setSelectedJids([]);
      fetchContacts();
    } catch (err: any) {
      setGroupCreateError(err?.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <>
      <Header title="Contacts" subtitle={`${pagination?.total || 0} contacts`} />
      <div className="page-content">
        {/* Actions bar */}
        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="search-wrapper" style={{ maxWidth: 280 }}>
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

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-secondary" />
              <select
                id="contacts-group-filter"
                className="input"
                style={{ width: 180, height: 38, fontSize: 'var(--text-sm)' }}
                value={selectedGroup}
                onChange={(e) => { setSelectedGroup(e.target.value); setPage(1); }}
              >
                <option value="">All Groups ({groups.reduce((acc, g) => acc + g.count, 0)})</option>
                {groups.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name} ({g.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="create-group-btn"
              className="btn btn-secondary flex items-center gap-2"
              onClick={() => setShowCreateGroupModal(true)}
            >
              <Plus size={16} />
              <span>Create Group ({selectedJids.length > 0 ? selectedJids.length : 'All'})</span>
            </button>

            <button
              id="import-contacts-btn"
              className="btn btn-primary flex items-center gap-2"
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={16} />
              <span>Import Contacts</span>
            </button>
          </div>
        </div>

        {selectedJids.length > 0 && (
          <div
            className="alert alert-info flex items-center justify-between"
            style={{ marginBottom: 16, background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }}
          >
            <span className="text-sm font-medium">
              <strong>{selectedJids.length}</strong> contacts selected
            </span>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary btn-sm flex items-center gap-1"
                onClick={() => setShowCreateGroupModal(true)}
              >
                <Tag size={13} />
                <span>Assign to Group</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedJids([])}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="table-container">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={6} />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <Users />
            <p>No contacts found{search ? ` for "${search}"` : selectedGroup ? ` in group "${selectedGroup}"` : ''}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Groups</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => {
                  const isChecked = selectedJids.includes(contact.jid);
                  return (
                    <tr
                      key={contact.jid}
                      id={`contact-${contact.jid}`}
                      style={{ background: isChecked ? 'rgba(99,102,241,0.04)' : undefined }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectJid(contact.jid)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="chat-avatar" style={{ width: 36, height: 36, fontSize: 'var(--text-sm)' }}>
                            {contact.profilePicUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={contact.profilePicUrl}
                                alt={contact.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              />
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
                          <span className="text-sm font-mono">{formatPhoneNumber(contact.phone || contact.jid)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 flex-wrap">
                          {contact.groups && contact.groups.length > 0 ? (
                            contact.groups.map((g: string) => (
                              <span key={g} className="badge badge-neutral" style={{ fontSize: 'var(--text-xs)' }}>
                                <Tag size={10} style={{ marginRight: 4 }} />
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-secondary">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {contact.isBusiness ? (
                          <span className="badge badge-info">Business</span>
                        ) : (
                          <span className="badge badge-neutral">Personal</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-secondary btn-sm flex items-center gap-1"
                            title="Edit Contact"
                            onClick={() => handleOpenEdit(contact)}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            title="Delete Contact"
                            onClick={() => handleDelete(contact)}
                          >
                            <Trash2 size={13} />
                          </button>
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
              Showing {contacts.length} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button id="contacts-prev" className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button id="contacts-next" className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="card" style={{ width: '100%', maxWidth: 540 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <Upload className="text-accent" size={20} />
                <h3 className="font-semibold text-lg">Import &amp; Group Contacts</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Assign Groups / Tags on Upload</label>
                <div className="flex gap-2" style={{ marginBottom: 8 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter group name (e.g. Customers, VIP, Leads)"
                    value={importGroupTag}
                    onChange={(e) => setImportGroupTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImportGroup(); } }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleAddImportGroup}>
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedGroupsForImport.map((tag) => (
                    <span key={tag} className="badge badge-accent flex items-center gap-1">
                      {tag}
                      <X size={12} className="cursor-pointer" onClick={() => handleRemoveImportGroup(tag)} />
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Paste Contacts (CSV or Line-by-Line)</label>
                <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>
                  Format: <code>Name, Phone</code> or just <code>Phone</code> per line.
                </p>
                <textarea
                  className="input"
                  rows={6}
                  placeholder={`Alice, +1234567890\nBob, 9876543210\n+1987654321`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  required
                />
              </div>

              {importMessage && (
                <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 'var(--text-xs)' }}>
                  {importMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={importing || !importText.trim()}>
                  {importing ? 'Importing...' : 'Upload & Assign Groups'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="modal-backdrop">
          <div className="card" style={{ width: '100%', maxWidth: 480 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <Pencil size={20} className="text-accent" />
                <h3 className="font-semibold text-lg">Edit Contact</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingContact(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-secondary" />
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="e.g. 919876543210"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Display Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter contact name..."
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Groups (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. VIP, Customers, Leads"
                  value={editGroupsText}
                  onChange={(e) => setEditGroupsText(e.target.value)}
                />
                <p className="text-xs text-secondary" style={{ marginTop: 4 }}>Separate group names with commas.</p>
              </div>

              {editError && (
                <div className="alert alert-danger" style={{ marginBottom: 16, fontSize: 'var(--text-xs)' }}>
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingContact(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={editSaving}>
                  <Save size={16} />
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Separate Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-backdrop">
          <div className="card" style={{ width: '100%', maxWidth: 480 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <Tag size={20} className="text-accent" />
                <h3 className="font-semibold text-lg">Create Contact Group</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateGroupModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Group Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter new group name (e.g. VIP Customers, Hot Leads)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <label className="label font-semibold" style={{ margin: 0 }}>Target Contacts</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-xs"
                    onClick={handleSelectAll}
                  >
                    {allSelected ? 'Deselect All' : 'Select All Contacts'}
                  </button>
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {selectedJids.length > 0 ? (
                    <>Adding group tag to <strong>{selectedJids.length}</strong> selected contacts.</>
                  ) : (
                    <>No specific contacts checked. Group will be assigned to <strong>all {contacts.length}</strong> contacts on this page.</>
                  )}
                </div>
              </div>

              {groupCreateError && (
                <div className="alert alert-danger" style={{ marginBottom: 16, fontSize: 'var(--text-xs)' }}>
                  {groupCreateError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateGroupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={creatingGroup || !newGroupName.trim()}>
                  <Plus size={16} />
                  {creatingGroup ? 'Creating Group...' : 'Create & Assign Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
