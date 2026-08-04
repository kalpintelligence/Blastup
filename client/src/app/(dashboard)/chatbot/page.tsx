'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { chatbotApi } from '@/lib/api';
import {
  Bot, Plus, Trash2, Save, Copy, CheckCheck, ToggleLeft, ToggleRight,
  Zap, MessageSquare, Code2, Settings, ChevronDown, ChevronUp, Globe
} from 'lucide-react';

interface ChatbotRule {
  _id?: string;
  keyword: string;
  response: string;
  matchType: 'exact' | 'contains' | 'startsWith';
}

export default function ChatbotPage() {
  const [enabled, setEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! Welcome. How can I help you today? 👋');
  const [fallbackMessage, setFallbackMessage] = useState("Sorry, I didn't understand that. Please type 'help' to see available options.");
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [primaryColor, setPrimaryColor] = useState('#25D366');
  const [rules, setRules] = useState<ChatbotRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'settings' | 'rules' | 'embed'>('settings');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    chatbotApi.get().then((res) => {
      const d = res.data;
      if (d) {
        setEnabled(d.enabled || false);
        setWelcomeMessage(d.welcomeMessage || 'Hello! Welcome. How can I help you today? 👋');
        setFallbackMessage(d.fallbackMessage || "Sorry, I didn't understand that.");
        setPosition(d.position || 'bottom-right');
        setPrimaryColor(d.primaryColor || '#25D366');
        setRules(d.rules || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAddRule = () => {
    setRules([...rules, { keyword: '', response: '', matchType: 'contains' }]);
  };

  const handleRemoveRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleRuleChange = (idx: number, field: keyof ChatbotRule, value: string) => {
    const updated = [...rules];
    (updated[idx] as any)[field] = value;
    setRules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await chatbotApi.update({ enabled, welcomeMessage, fallbackMessage, position, primaryColor, rules });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save chatbot settings.');
    } finally {
      setSaving(false);
    }
  };

  const backendUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001';

  const embedCode = `<!-- Blastup WhatsApp Chatbot Widget -->
<script>
  window.BlastupConfig = {
    token: 'YOUR_API_KEY_HERE',
    apiUrl: '${backendUrl}',
    position: '${position}',
    primaryColor: '${primaryColor}',
    welcomeText: '${welcomeMessage.slice(0, 50).replace(/'/g, "\\'")}...',
  };
</script>
<script src="https://cdn.blastup.io/widget.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Header title="Chatbot" subtitle="AI-powered auto-response engine" />
        <div className="page-content">
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <Bot size={40} style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
            <p className="text-secondary">Loading chatbot configuration...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Chatbot" subtitle="Keyword-triggered auto-response engine for WhatsApp" />
      <div className="page-content" style={{ maxWidth: 900 }}>

        {/* Status Banner */}
        <div
          className="card"
          style={{
            marginBottom: 24,
            background: enabled
              ? 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.08) 100%)'
              : 'var(--color-bg-secondary)',
            border: `1px solid ${enabled ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: enabled
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'var(--color-bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: enabled ? '0 4px 20px rgba(34,197,94,0.4)' : 'none',
                }}
              >
                <Bot size={24} color={enabled ? 'white' : 'var(--color-text-secondary)'} />
              </div>
              <div>
                <div className="font-semibold" style={{ fontSize: 'var(--text-base)' }}>
                  Chatbot Auto-Responder
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                  {enabled ? `Active · ${rules.length} rules configured` : 'Inactive · Enable to start responding automatically'}
                </div>
              </div>
            </div>

            <button
              className={`flex items-center gap-2 font-semibold`}
              style={{
                background: enabled
                  ? 'rgba(34,197,94,0.15)'
                  : 'var(--color-bg-tertiary)',
                color: enabled ? '#22c55e' : 'var(--color-text-secondary)',
                border: `1px solid ${enabled ? 'rgba(34,197,94,0.4)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-pill)',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setEnabled(!enabled)}
            >
              {enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              <span>{enabled ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2" style={{ marginBottom: 20 }}>
          {[
            { key: 'settings', label: 'Settings', icon: Settings },
            { key: 'rules', label: `Auto-Reply Rules (${rules.length})`, icon: Zap },
            { key: 'embed', label: 'Embed Widget', icon: Code2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`flex items-center gap-2 btn btn-sm ${activeSection === key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSection(key as any)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* SETTINGS SECTION */}
        {activeSection === 'settings' && (
          <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
            <h3 className="font-semibold" style={{ marginBottom: 20, fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
              Message Templates
            </h3>

            <div style={{ marginBottom: 20 }}>
              <label className="label font-semibold">Welcome Message</label>
              <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>
                Sent automatically when a new contact messages for the first time.
              </p>
              <textarea
                className="input"
                rows={3}
                placeholder="Hello! Welcome..."
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label font-semibold">Fallback Message</label>
              <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>
                Sent when no keyword rule matches the incoming message.
              </p>
              <textarea
                className="input"
                rows={3}
                placeholder="Sorry, I didn't understand..."
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label font-semibold">Widget Screen Position</label>
                <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>
                  Where the website chat bubble popup should appear.
                </p>
                <select
                  className="input"
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                >
                  <option value="bottom-right">Bottom Right (Default)</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label className="label font-semibold">Widget Brand Color</label>
                <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>
                  Accent color for the website chat popup widget.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    style={{ width: 44, height: 42, border: 'none', background: 'none', cursor: 'pointer' }}
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input font-mono"
                    style={{ maxWidth: 140 }}
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RULES SECTION */}
        {activeSection === 'rules' && (
          <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <div>
                <h3 className="font-semibold" style={{ fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={18} style={{ color: '#f59e0b' }} />
                  Keyword-Based Auto-Reply Rules
                </h3>
                <p className="text-xs text-secondary" style={{ marginTop: 4 }}>
                  When a message matches a keyword, the chatbot responds automatically.
                </p>
              </div>
              <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleAddRule}>
                <Plus size={14} /> Add Rule
              </button>
            </div>

            {rules.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Zap size={32} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px' }} />
                <p className="text-secondary text-sm">No rules yet. Add a keyword rule to start auto-responding.</p>
                <button className="btn btn-primary btn-sm flex items-center gap-2" style={{ margin: '16px auto 0' }} onClick={handleAddRule}>
                  <Plus size={14} /> Add Your First Rule
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      background: 'var(--color-bg-primary)',
                      padding: '14px 16px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 1fr auto',
                      gap: 10,
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <label className="label" style={{ fontSize: 10, marginBottom: 4 }}>KEYWORD</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. price, help, order"
                        value={rule.keyword}
                        onChange={(e) => handleRuleChange(idx, 'keyword', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: 10, marginBottom: 4 }}>MATCH TYPE</label>
                      <select
                        className="input"
                        value={rule.matchType}
                        onChange={(e) => handleRuleChange(idx, 'matchType', e.target.value as any)}
                      >
                        <option value="contains">Contains</option>
                        <option value="exact">Exact</option>
                        <option value="startsWith">Starts With</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: 10, marginBottom: 4 }}>AUTO-RESPONSE</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Response when keyword matched..."
                        value={rule.response}
                        onChange={(e) => handleRuleChange(idx, 'response', e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--color-danger)', marginTop: 24, width: 38, flexShrink: 0 }}
                      onClick={() => handleRemoveRule(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EMBED SECTION */}
        {activeSection === 'embed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Widget Preview Card */}
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, #0a0a1a 0%, #111827 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 32,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -60,
                  right: -60,
                  width: 200,
                  height: 200,
                  background: 'radial-gradient(circle, rgba(37,211,102,0.15) 0%, transparent 70%)',
                  borderRadius: '50%',
                }}
              />
              <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <Globe size={20} style={{ color: '#25D366' }} />
                <h3 className="font-semibold text-white" style={{ fontSize: 'var(--text-base)' }}>
                  Website Widget Embed
                </h3>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-sm)', marginBottom: 20 }}>
                Embed this snippet just before the closing <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>&lt;/body&gt;</code> tag on your website to add a WhatsApp chat widget.
              </p>

              <div style={{ position: 'relative' }}>
                <pre
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    color: '#a8ff78',
                    fontSize: 12,
                    lineHeight: 1.6,
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {embedCode}
                </pre>
                <button
                  className="btn btn-sm flex items-center gap-2"
                  onClick={handleCopy}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
                    border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.2)'}`,
                    color: copied ? '#22c55e' : 'white',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
              <h4 className="font-semibold" style={{ marginBottom: 16, fontSize: 'var(--text-sm)' }}>
                📋 Integration Steps
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { step: '1', title: 'Get Your API Key', desc: 'Navigate to API Keys & Settings to generate your API key.' },
                  { step: '2', title: 'Replace Placeholder', desc: "Replace 'YOUR_API_KEY_HERE' in the code above with your actual API key." },
                  { step: '3', title: 'Paste in HTML', desc: 'Copy the embed code and paste it just before the closing </body> tag in your HTML.' },
                  { step: '4', title: 'Enable Chatbot', desc: 'Make sure the chatbot is enabled above and at least one keyword rule is configured.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Button - always visible */}
        <div className="flex justify-end" style={{ marginTop: 20 }}>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 140 }}
          >
            {saved ? (
              <><CheckCheck size={16} /> Saved!</>
            ) : saving ? (
              <><Save size={16} /> Saving...</>
            ) : (
              <><Save size={16} /> Save Settings</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
