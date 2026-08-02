'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Settings, Info, Key, Trash2, Copy, Plus, Eye, EyeOff, Check } from 'lucide-react';
import { keysApi } from '@/lib/api';
import Modal from '@/components/ui/Modal';

interface ApiKeyDoc {
  _id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant?: 'danger' | 'info' | 'success';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const res = await keysApi.list();
      setKeys(res.data);
    } catch (err) {
      // silent catch
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await keysApi.create(newKeyName);
      setNewKeyName('');
      loadKeys();
      setModalState({
        isOpen: true,
        title: 'API Key Created Successfully',
        description: `Your new API Key "${res.data.name}" has been generated. Key: ${res.data.key}`,
        variant: 'success',
      });
    } catch (err) {
      setModalState({
        isOpen: true,
        title: 'Creation Failed',
        description: 'Failed to create API key. Please try again.',
        variant: 'danger',
      });
    }
  };

  const promptDeleteKey = (id: string, name: string) => {
    setModalState({
      isOpen: true,
      title: 'Revoke API Key',
      description: `Are you sure you want to revoke "${name}"? External applications using this key will immediately lose access.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await keysApi.delete(id);
          loadKeys();
        } catch {
          // silent
        }
      },
    });
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Header title="Settings" subtitle="Application configuration & API Key management" />
      <div className="page-content">
        <div style={{ maxWidth: 680 }}>
          
          {/* API Keys Section */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Key size={18} style={{ color: 'var(--color-primary)' }} />
                API Keys Management
              </span>
              <span className="badge badge-neutral">{keys.length} Keys</span>
            </div>
            <p className="text-xs text-secondary" style={{ marginBottom: 16 }}>
              API Keys allow external tools (Zapier, Make, Custom Scripts) to send WhatsApp messages. Pass the key in the <code>X-API-Key</code> or <code>Authorization: Bearer</code> header.
            </p>

            <form onSubmit={handleCreate} className="flex gap-2" style={{ marginBottom: 24 }}>
              <input
                type="text"
                className="input"
                placeholder="New key name (e.g. Zapier Production, Make Integration)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                maxLength={50}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={!newKeyName.trim()}>
                <Plus size={16} /> Generate Key
              </button>
            </form>

            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-xs text-secondary py-4">Loading API keys...</div>
              ) : keys.length === 0 ? (
                <div className="text-xs text-secondary py-4">No API keys created yet. Generate one above!</div>
              ) : (
                keys.map((key) => {
                  const isVisible = !!showKeys[key._id];
                  const isCopied = copiedId === key._id;
                  const displayValue = isVisible
                    ? key.key || 'wa_key_hidden'
                    : (key.key ? key.key.substring(0, 7) + '••••••••••••••••••••••••' : 'wa_••••••••••••••••');

                  return (
                    <div
                      key={key._id}
                      className="flex justify-between items-center"
                      style={{
                        padding: 14,
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                        <div className="font-serif font-bold text-sm">{key.name}</div>
                        
                        <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                          <code style={{ fontSize: 11, backgroundColor: 'var(--color-bg)', padding: '2px 8px', borderRadius: 4 }}>
                            {displayValue}
                          </code>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => toggleShowKey(key._id)}
                            title={isVisible ? 'Hide Key' : 'View Key'}
                            style={{ padding: 2 }}
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => copyToClipboard(key.key || key._id, key._id)}
                            title="Copy Key"
                            style={{ padding: 2 }}
                          >
                            {isCopied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                          </button>
                        </div>

                        <div className="text-xs text-secondary" style={{ marginTop: 6, fontSize: 10 }}>
                          Created: {new Date(key.createdAt).toLocaleDateString()} · Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => promptDeleteKey(key._id, key.name)}
                        title="Delete API Key"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* About & Environment */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">System Information</span>
              <Info size={16} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <div className="flex flex-col gap-2 text-xs text-secondary">
              <div className="flex justify-between">
                <span>Platform Version</span>
                <span className="font-semibold text-main">Blastup v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>API Endpoint</span>
                <code>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</code>
              </div>
              <div className="flex justify-between">
                <span>Primary Color Accent</span>
                <code style={{ color: '#33D951', fontWeight: 'bold' }}>#33D951 (WhatsApp Green)</code>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Reusable Modal Dialog */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        description={modalState.description}
        variant={modalState.variant}
        onConfirm={modalState.onConfirm}
      />
    </>
  );
}
