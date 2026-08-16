'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { authApi, whatsappApi } from '@/lib/api';
import {
  User, Shield, Clock, MapPin, Key, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, LogOut, Wifi, WifiOff, Phone, Smartphone, Bot, Sparkles
} from 'lucide-react';
import { logout } from '@/lib/auth';

interface UserProfile {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  openaiConfigured: boolean;
  openaiKeyLast4: string | null;
  geminiConfigured: boolean;
  geminiKeyLast4: string | null;
  aiProvider: 'auto' | 'openai' | 'gemini';
  aiOwnerName: string | null;
  aiRelationshipNotes: string | null;
  aiAutomationEnabled: boolean;
  aiReplyEnabled: boolean;
  aiOnlyReplyEnabled: boolean;
}

interface WhatsAppProfile {
  status: string;
  phone: string | null;
  pushName: string | null;
  profilePicUrl: string | null;
  platform: string | null;
  lastConnectedAt: string | null;
}

export default function ProfilePage() {
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [waProfile, setWaProfile] = useState<WhatsAppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState<{ success: boolean; message: string } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [aiProvider, setAiProvider] = useState<'auto' | 'openai' | 'gemini'>('auto');
  const [aiAutomationEnabled, setAiAutomationEnabled] = useState(false);
  const [aiReplyEnabled, setAiReplyEnabled] = useState(false);
  const [aiOnlyReplyEnabled, setAiOnlyReplyEnabled] = useState(true);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiResult, setAiResult] = useState<{ success: boolean; message: string } | null>(null);
  const [creditStatus, setCreditStatus] = useState<{ percentage: number | null; status: string; message: string } | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [relationshipNotes, setRelationshipNotes] = useState('');
  const [trainingFiles, setTrainingFiles] = useState<File[]>([]);
  const [trainingResult, setTrainingResult] = useState<string | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, waRes] = await Promise.all([
          authApi.me().catch(() => null),
          whatsappApi.getStatus().catch(() => null),
        ]);
        if (meRes?.data?.user) {
          setDbUser(meRes.data.user);
          setAiAutomationEnabled(!!meRes.data.user.aiAutomationEnabled);
          setAiReplyEnabled(!!meRes.data.user.aiReplyEnabled);
          setAiOnlyReplyEnabled(meRes.data.user.aiOnlyReplyEnabled !== false);
          setAiProvider(meRes.data.user.aiProvider || 'auto');
          setOwnerName(meRes.data.user.aiOwnerName || '');
          setRelationshipNotes(meRes.data.user.aiRelationshipNotes || '');
          if (meRes.data.user.openaiConfigured || meRes.data.user.geminiConfigured) {
            const creditRes = await authApi.getAICreditStatus().catch(() => null);
            if (creditRes?.data) setCreditStatus(creditRes.data);
          }
        }
        if (waRes?.data) setWaProfile(waRes.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwResult(null);

    if (newPassword !== confirmPassword) {
      setPwResult({ success: false, message: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setPwResult({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwResult({ success: true, message: 'Password updated successfully! Signing you out...' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      setPwResult({ success: false, message: err?.data?.message || err?.message || 'Failed to update password' });
    } finally {
      setPwLoading(false);
    }
  };

  const saveAISettings = async () => {
    setAiSaving(true); setAiResult(null);
    try {
      const response = await authApi.updateAISettings({ apiKey: apiKey.trim() || undefined, geminiApiKey: geminiApiKey.trim() || undefined, aiProvider, aiAutomationEnabled, aiReplyEnabled, aiOnlyReplyEnabled, aiOwnerName: ownerName, aiRelationshipNotes: relationshipNotes });
      setDbUser(current => current ? { ...current, ...response.data } : current);
      setApiKey('');
      setGeminiApiKey('');
      setAiResult({ success: true, message: 'AI settings saved.' });
      const creditRes = await authApi.getAICreditStatus().catch(() => null);
      if (creditRes?.data) setCreditStatus(creditRes.data);
    } catch (err: any) {
      setAiResult({ success: false, message: err?.data?.message || err?.message || 'Could not save AI settings.' });
    } finally { setAiSaving(false); }
  };

  const uploadTraining = async () => {
    if (!trainingFiles.length || !ownerName.trim()) { setTrainingResult('Choose one or more .txt exports and enter your name as shown inside them.'); return; }
    setTrainingLoading(true); setTrainingResult(null);
    try {
      const results = await Promise.all(trainingFiles.map(file => authApi.uploadChatTraining(file, ownerName.trim(), file.name.replace(/\.txt$/i, ''))));
      const imported = results.reduce((sum, response) => sum + response.data.imported, 0);
      const yours = results.reduce((sum, response) => sum + response.data.yourMessages, 0);
      setTrainingResult(`Processed ${trainingFiles.length} chats and learned from ${imported} messages, including ${yours} written by you.`);
      setTrainingFiles([]);
    } catch (err: any) { setTrainingResult(err?.message || 'Could not import this chat export.'); }
    finally { setTrainingLoading(false); }
  };

  const removeGeminiKey = async () => {
    setAiSaving(true); setAiResult(null);
    try {
      const response = await authApi.updateAISettings({ removeGeminiKey: true, aiProvider: dbUser?.openaiConfigured ? 'openai' : 'auto', aiReplyEnabled, aiOnlyReplyEnabled });
      setDbUser(current => current ? { ...current, ...response.data } : current);
      setAiProvider(response.data.aiProvider || 'auto'); setGeminiApiKey(''); setCreditStatus(null);
      setAiResult({ success: true, message: 'Gemini key removed.' });
    } catch (err: any) { setAiResult({ success: false, message: err?.message || 'Could not remove Gemini key.' }); }
    finally { setAiSaving(false); }
  };

  const removeAIKey = async () => {
    setAiSaving(true); setAiResult(null);
    try {
      const response = await authApi.updateAISettings({ removeApiKey: true, aiProvider: dbUser?.geminiConfigured ? 'gemini' : 'auto', aiAutomationEnabled: !!dbUser?.geminiConfigured && aiAutomationEnabled, aiReplyEnabled, aiOnlyReplyEnabled });
      setDbUser(current => current ? { ...current, ...response.data } : current);
      setAiAutomationEnabled(response.data.aiAutomationEnabled); setAiProvider(response.data.aiProvider || 'auto'); setApiKey('');
      setCreditStatus(null);
      setAiResult({ success: true, message: 'OpenAI key removed. Chat replies require another configured AI provider.' });
    } catch (err: any) { setAiResult({ success: false, message: err?.message || 'Could not remove key.' }); }
    finally { setAiSaving(false); }
  };

  const isConnected = waProfile?.status === 'connected' && (waProfile.pushName || waProfile.phone);

  const displayName = isConnected
    ? waProfile.pushName || `+${waProfile.phone}`
    : dbUser?.username || 'User';

  const displayPhone = isConnected && waProfile?.phone ? `+${waProfile.phone}` : null;
  const profilePic = isConnected ? waProfile?.profilePicUrl : null;
  const initials = displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'U';

  if (loading) {
    return (
      <>
        <Header title="Profile" subtitle="Your profile and account settings" />
        <div className="page-content">
          <div className="empty-state"><div className="spinner" /></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Profile" subtitle="WhatsApp account details & security settings" />
      <div className="page-content">
        <div style={{ maxWidth: 680 }}>

          {/* Profile Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="flex items-center gap-5" style={{ padding: '8px 0 20px' }}>
              {/* Profile Image / Avatar */}
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={displayName}
                  style={{
                    width: 76, height: 76, borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid var(--color-primary)', flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  backgroundColor: isConnected ? 'rgba(51, 217, 81, 0.12)' : 'var(--color-bg)',
                  color: isConnected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontFamily: 'var(--font-serif)', fontWeight: 700,
                  border: `3px solid ${isConnected ? 'var(--color-primary)' : 'var(--color-border)'}`, flexShrink: 0,
                }}>
                  {initials}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22,
                  color: 'var(--color-text)',
                }}>
                  {displayName}
                </div>

                <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                  {isConnected ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Wifi size={12} /> WhatsApp Connected
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <WifiOff size={12} /> WhatsApp Disconnected
                    </span>
                  )}

                  {displayPhone && (
                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} /> {displayPhone}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-danger)' }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              }}>
                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <Smartphone size={12} /> WhatsApp Device
                  </div>
                  <div className="font-medium text-sm">
                    {isConnected ? (waProfile?.platform || 'WhatsApp Mobile / Multi-Device') : 'Not scanned'}
                  </div>
                </div>

                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <Phone size={12} /> WhatsApp Number
                  </div>
                  <div className="font-medium text-sm" style={{ fontFamily: 'monospace' }}>
                    {displayPhone || 'Not connected'}
                  </div>
                </div>

                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <Clock size={12} /> Last Login
                  </div>
                  <div className="font-medium text-sm">
                    {dbUser?.lastLoginAt
                      ? new Date(dbUser.lastLoginAt).toLocaleString()
                      : 'Never recorded'}
                  </div>
                </div>

                <div style={{ padding: 14, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-2 text-xs text-secondary" style={{ marginBottom: 4 }}>
                    <User size={12} /> System Account
                  </div>
                  <div className="font-medium text-sm">
                    {dbUser?.username || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title flex items-center gap-2"><Sparkles size={18} style={{ color: 'var(--color-primary)' }} />AI Providers</span>
              <div className="flex items-center gap-2">{dbUser?.openaiConfigured && <span className="badge badge-success">OpenAI ····{dbUser.openaiKeyLast4}</span>}{dbUser?.geminiConfigured && <span className="badge badge-success">Gemini ····{dbUser.geminiKeyLast4}</span>}</div>
            </div>
            <p className="text-xs text-secondary" style={{ marginBottom: 16 }}>
              Provider keys are encrypted. In Auto mode, Blastup tries the available cloud AI providers. No customer reply is sent when no provider is available.
            </p>
            {aiResult && <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16, background: aiResult.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: aiResult.success ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 13 }}>{aiResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{aiResult.message}</div>}
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label" htmlFor="openai-key">OpenAI API key</label>
              <div style={{ position: 'relative' }}>
                <Key size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input id="openai-key" type={showApiKey ? 'text' : 'password'} className="input" style={{ paddingLeft: 38, paddingRight: 42 }} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={dbUser?.openaiConfigured ? 'Enter a new key to replace the saved key' : 'sk-...'} autoComplete="off" />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>{showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label" htmlFor="gemini-key">Gemini API key</label>
              <div style={{ position: 'relative' }}>
                <Key size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input id="gemini-key" type={showGeminiKey ? 'text' : 'password'} className="input" style={{ paddingLeft: 38, paddingRight: 42 }} value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} placeholder={dbUser?.geminiConfigured ? 'Enter a new key to replace the saved key' : 'Gemini API key'} autoComplete="off" />
                <button type="button" onClick={() => setShowGeminiKey(!showGeminiKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>{showGeminiKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label" htmlFor="ai-provider">Preferred provider</label>
              <select id="ai-provider" className="input" value={aiProvider} onChange={e => setAiProvider(e.target.value as 'auto' | 'openai' | 'gemini')}>
                <option value="auto">Auto — use any available AI</option><option value="openai">OpenAI</option><option value="gemini">Google Gemini</option>
              </select>
            </div>
            {(dbUser?.openaiConfigured || dbUser?.geminiConfigured) && creditStatus && (
              <div style={{ padding: 14, marginBottom: 16, background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="font-medium text-sm">API credit availability</span>
                  <span className="font-medium text-sm" style={{ color: creditStatus.percentage === 0 ? 'var(--color-danger)' : creditStatus.percentage === 100 ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>{creditStatus.percentage === null ? 'Unknown' : `${creditStatus.percentage}%`}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, overflow: 'hidden', background: 'var(--color-border)' }}>
                  <div style={{ height: '100%', width: `${creditStatus.percentage || 0}%`, background: creditStatus.percentage === 0 ? 'var(--color-danger)' : 'var(--color-success)', transition: 'width .25s ease' }} />
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 7 }}>{creditStatus.message}. A regular project key only reports available or exhausted; exact remaining balance requires an OpenAI Admin API key.</div>
              </div>
            )}
            {[
              { label: 'Understand commands automatically', detail: 'Create tasks, reminders, reports, campaigns and chatbot flows from natural language in your personal WhatsApp chat.', value: aiAutomationEnabled, set: setAiAutomationEnabled, icon: Sparkles },
              { label: 'Reply to chat', detail: 'Master switch for automatic customer replies. Turn it off to send no automatic replies.', value: aiReplyEnabled, set: setAiReplyEnabled, icon: Bot },
              { label: 'Reply from AI only', detail: 'Use only the selected OpenAI/Gemini provider. If AI is unavailable, send nothing instead of using chatbot flows.', value: aiOnlyReplyEnabled, set: setAiOnlyReplyEnabled, icon: Sparkles },
            ].map(option => <div key={option.label} className="flex items-center gap-3" style={{ padding: '13px 0', borderTop: '1px solid var(--color-border-subtle)' }}><option.icon size={17} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /><div style={{ flex: 1 }}><div className="font-medium text-sm">{option.label}</div><div className="text-xs text-secondary">{option.detail}</div></div><input type="checkbox" checked={option.value} onChange={e => option.set(e.target.checked)} disabled={(option.label === 'Reply from AI only' && (!aiReplyEnabled || (!dbUser?.openaiConfigured && !dbUser?.geminiConfigured && !apiKey.trim() && !geminiApiKey.trim()))) || (option.label === 'Understand commands automatically' && !dbUser?.openaiConfigured && !dbUser?.geminiConfigured && !apiKey.trim() && !geminiApiKey.trim())} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} /></div>)}
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16, marginTop: 4 }}>
              <div className="font-medium text-sm" style={{ marginBottom: 4 }}>Train from WhatsApp chat</div>
              <div className="text-xs text-secondary" style={{ marginBottom: 12 }}>Export a chat from WhatsApp without media, then upload the .txt file. The full export stays in your local Blastup database.</div>
              <div className="input-group" style={{ marginBottom: 12 }}><label className="input-label">Your name in the export</label><input className="input" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Example: Aman Sharma" /></div>
              <div className="input-group" style={{ marginBottom: 12 }}><label className="input-label">People and relationships</label><textarea className="input" rows={4} value={relationshipNotes} onChange={e => setRelationshipNotes(e.target.value)} placeholder={'Rahul is my brother\nMom is Sunita\nRiya is a client'} /></div>
              <div className="input-group" style={{ marginBottom: 10 }}><label className="input-label">WhatsApp exported chats (.txt)</label><input type="file" multiple accept=".txt,text/plain" onChange={e => setTrainingFiles(Array.from(e.target.files || []))} /><div className="text-xs text-secondary" style={{ marginTop: 5 }}>{trainingFiles.length ? `${trainingFiles.length} chat files selected` : 'Select as many exported chats as you want.'}</div></div>
              <button type="button" className="btn btn-secondary" onClick={uploadTraining} disabled={trainingLoading || !trainingFiles.length}>{trainingLoading ? `Learning from ${trainingFiles.length} chats...` : 'Upload chats and learn'}</button>
              {trainingResult && <div className="text-xs" style={{ marginTop: 8 }}>{trainingResult}</div>}
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-primary" onClick={saveAISettings} disabled={aiSaving}>{aiSaving ? 'Saving...' : 'Save AI Settings'}</button>
              {dbUser?.openaiConfigured && <button type="button" className="btn btn-secondary" onClick={removeAIKey} disabled={aiSaving} style={{ color: 'var(--color-danger)' }}>Remove key</button>}
              {dbUser?.geminiConfigured && <button type="button" className="btn btn-secondary" onClick={removeGeminiKey} disabled={aiSaving} style={{ color: 'var(--color-danger)' }}>Remove Gemini</button>}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title flex items-center gap-2">
                <Lock size={18} style={{ color: 'var(--color-primary)' }} />
                Change Password
              </span>
            </div>
            <p className="text-xs text-secondary" style={{ marginBottom: 16 }}>
              Update system access credentials. Updating password will end active sessions.
            </p>

            {pwResult && (
              <div
                className="flex items-center gap-2"
                style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  background: pwResult.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: pwResult.success ? 'var(--color-success)' : 'var(--color-danger)',
                  border: `1px solid ${pwResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  fontSize: 13,
                }}
              >
                {pwResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {pwResult.message}
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="current-password">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 38, paddingRight: 40 }}
                    placeholder="Your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={pwLoading}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 0 }}>
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 38, paddingRight: 40 }}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    minLength={8}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={pwLoading}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 0 }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirm-new-password">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    id="confirm-new-password"
                    type={showNew ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={pwLoading}
                  />
                </div>
              </div>

              <button
                id="change-password-submit"
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', minWidth: 180 }}
                disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                <Lock size={14} />
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
