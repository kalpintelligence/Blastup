'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { campaignsApi, contactsApi } from '@/lib/api';
import { Megaphone, Calendar, Users, Plus, Trash2, ArrowLeft, Send, Zap, ShoppingBag, MessageSquare, Check, ChevronRight } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Audience', icon: Users },
  { id: 2, label: 'Message', icon: MessageSquare },
  { id: 3, label: 'Extras', icon: Zap },
  { id: 4, label: 'Schedule', icon: Calendar },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [groups, setGroups] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [templateText, setTemplateText] = useState('Hello {{name}},\n\nWe have an exclusive offer just for you!');
  const [defaultName, setDefaultName] = useState('Friend');
  const [mediaUrl, setMediaUrl] = useState('');
  const [interactiveType, setInteractiveType] = useState<'none' | 'button' | 'slider'>('none');
  const [buttons, setButtons] = useState<Array<{ type: 'reply' | 'url' | 'call'; displayText: string; idOrUrl?: string }>>([
    { type: 'url', displayText: 'Tap Continue', idOrUrl: 'https://example.com' },
  ]);
  const [sliderItems, setSliderItems] = useState<Array<{ title: string; description?: string; price?: string; buttonText?: string }>>([
    { title: 'Featured Product 1', description: 'Premium quality item', price: '$49.99', buttonText: 'Buy Now' },
    { title: 'Featured Product 2', description: 'Top rated', price: '$29.99', buttonText: 'View Details' },
  ]);
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contactsApi.getGroups().then((res) => setGroups(res.data || [])).catch(() => {});
    const nextHour = new Date(Date.now() + 3600000);
    setScheduledAt(nextHour.toISOString().slice(0, 16));
  }, []);

  const generateDefaultName = () => {
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `Campaign Broadcast - ${formattedDate}, ${formattedTime}`;
  };

  const handleUseDefaultName = () => {
    setName(generateDefaultName());
  };

  const handleSubmit = async () => {
    const finalName = name.trim() || generateDefaultName();
    if (!templateText.trim()) {
      setError('Message template is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const scheduledTime = sendOption === 'now' ? new Date().toISOString() : new Date(scheduledAt).toISOString();
      await campaignsApi.create({
        name: finalName,
        templateText,
        defaultName: defaultName.trim() || 'Friend',
        mediaUrl: mediaUrl.trim() || undefined,
        interactiveType,
        buttons: interactiveType === 'button' ? buttons : [],
        sliderItems: interactiveType === 'slider' ? sliderItems : [],
        targetGroups: selectedGroups,
        scheduledAt: scheduledTime,
      });
      router.push('/campaigns');
    } catch (err: any) {
      setError(err?.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const totalContacts = selectedGroups.length === 0
    ? groups.reduce((acc, g) => acc + g.count, 0)
    : groups.filter((g) => selectedGroups.includes(g.name)).reduce((acc, g) => acc + g.count, 0);

  return (
    <>
      <Header title="Create Campaign" subtitle="Launch a bulk WhatsApp broadcast in 4 easy steps" />
      <div className="page-content" style={{ maxWidth: 900 }}>

        {/* Back Button */}
        <button
          className="btn btn-secondary btn-sm flex items-center gap-2"
          style={{ marginBottom: 24 }}
          onClick={() => router.push('/campaigns')}
        >
          <ArrowLeft size={16} /> Back to Campaigns
        </button>

        {/* Stepper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 32,
            background: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center" style={{ flex: idx < STEPS.length - 1 ? 1 : 'initial' }}>
                <button
                  onClick={() => isDone && setStep(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'none',
                    border: 'none',
                    cursor: isDone ? 'pointer' : 'default',
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: isActive
                        ? '#6366f1'
                        : isDone
                        ? '#22c55e'
                        : 'var(--color-bg-tertiary, #f3f4f6)',
                      border: isActive ? 'none' : isDone ? 'none' : '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.4)' : isDone ? '0 4px 12px rgba(34,197,94,0.3)' : 'none',
                      transition: 'all 0.25s ease',
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? (
                      <Check size={20} style={{ color: '#ffffff' }} />
                    ) : (
                      <Icon size={20} style={{ color: isActive ? '#ffffff' : 'var(--color-text-secondary, #4b5563)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      Step {s.id}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: isActive ? 700 : isDone ? 600 : 500,
                        color: isActive ? '#6366f1' : isDone ? '#22c55e' : 'var(--color-text-secondary, #4b5563)',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      margin: '0 16px',
                      background: step > s.id
                        ? '#22c55e'
                        : 'var(--color-border)',
                      borderRadius: 3,
                      transition: 'background 0.3s ease',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

        {/* ── STEP 1: Audience ── */}
        {step === 1 && (
          <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
            <div style={{ marginBottom: 24 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <label className="label font-semibold">Campaign Name</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={handleUseDefaultName}
                  style={{ color: 'var(--color-primary)' }}
                >
                  ⚡ Auto Default Name
                </button>
              </div>
              <input
                type="text"
                className="input"
                placeholder="e.g. Summer Sale Blast (or click Auto Default Name)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: 'var(--text-base)' }}
              />
            </div>

            <div>
              <label className="label font-semibold">Target Audience Group</label>
              <p className="text-xs text-secondary" style={{ marginBottom: 12 }}>
                Select a group to target, or choose "All Contacts" to broadcast to your entire audience.
              </p>

              <div style={{ marginBottom: 16 }}>
                <select
                  className="input"
                  style={{ height: 44, fontSize: 'var(--text-sm)', background: 'var(--color-bg-primary)' }}
                  value={selectedGroups.length === 0 ? '' : selectedGroups[0]}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedGroups(val ? [val] : []);
                  }}
                >
                  <option value="">All Contacts ({groups.reduce((a, g) => a + g.count, 0)} total contacts)</option>
                  {groups.map((g) => (
                    <option key={g.name} value={g.name}>
                      Group: {g.name} ({g.count} contacts)
                    </option>
                  ))}
                </select>
              </div>

              {totalContacts > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(99,102,241,0.08)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Users size={16} />
                  <strong>{totalContacts}</strong> contacts selected for this campaign broadcast
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Message ── */}
        {step === 2 && (
          <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <label className="label font-semibold">Message Template</label>
                  <div className="text-xs text-secondary">
                    Variables: <code style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{'{{name}}'}</code>{' '}
                    <code style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{'{{phone}}'}</code>
                  </div>
                </div>
                <textarea
                  className="input"
                  rows={8}
                  placeholder="Type your WhatsApp message template..."
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
                <div className="text-xs text-secondary" style={{ marginTop: 6, marginBottom: 12 }}>
                  {templateText.length} characters
                </div>

                {/* Default Name Fallback */}
                <div
                  style={{
                    background: 'var(--color-bg-primary)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 16,
                  }}
                >
                  <label className="label font-semibold" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Default Name Fallback</span>
                    <span
                      style={{
                        fontSize: 11,
                        background: 'rgba(99,102,241,0.12)',
                        color: 'var(--color-primary)',
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontWeight: 500,
                      }}
                    >
                      used when contact has no name
                    </span>
                  </label>
                  <input
                    className="input"
                    placeholder='e.g. Friend, Valued Customer, there'
                    value={defaultName}
                    onChange={(e) => setDefaultName(e.target.value)}
                  />
                  <p className="text-xs text-secondary" style={{ marginTop: 4 }}>
                    When a contact has no name saved, <code style={{ background: 'var(--color-bg-tertiary)', padding: '1px 5px', borderRadius: 3 }}>{'{{name}}'}</code> will be replaced with this value.
                  </p>
                </div>

                {/* Attach Media / Image */}
                <div style={{ background: 'var(--color-bg-primary)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <label className="label font-semibold flex items-center gap-2" style={{ marginBottom: 6 }}>
                    <span>Attach Image / Media URL</span>
                    <span className="text-xs text-secondary font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    className="input font-mono"
                    placeholder="https://example.com/banner.png or media URL"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    style={{ fontSize: 'var(--text-xs)' }}
                  />
                  <p className="text-xs text-secondary" style={{ marginTop: 4 }}>
                    Supports PNG, JPG, JPEG or GIF images to be sent along with your broadcast message.
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="label font-semibold">Live Preview</label>
                <div
                  style={{
                    background: '#0b141a',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    minHeight: 280,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='300' fill='%230b141a'/%3E%3C/svg%3E")`,
                  }}
                >
                  <div
                    style={{
                      background: '#1e3a2f',
                      borderRadius: '0 12px 12px 12px',
                      padding: '10px 14px',
                      maxWidth: '85%',
                      fontSize: 13,
                      color: '#e9edef',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                    }}
                  >
                    {mediaUrl.trim() && (
                      <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', maxHeight: 180, background: '#000' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaUrl} alt="Attached Media" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                    {templateText
                      .replace(/\{\{name\}\}/g, defaultName.trim() || 'Friend')
                      .replace(/\{\{phone\}\}/g, '+91 98765 43210') || 'Your message preview will appear here...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Interactive Extras ── */}
        {step === 3 && (
          <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
            <label className="label font-semibold" style={{ marginBottom: 16, display: 'block' }}>Interactive Enhancements (Optional)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { type: 'none', icon: MessageSquare, label: 'Standard Text', desc: 'Plain WhatsApp broadcast' },
                { type: 'button', icon: Zap, label: 'Interactive Buttons', desc: 'Tap Continue / Quick Replies' },
                { type: 'slider', icon: ShoppingBag, label: 'eCommerce Slider', desc: 'Product Carousel Cards' },
              ].map(({ type, icon: Icon, label, desc }) => (
                <div
                  key={type}
                  onClick={() => setInteractiveType(type as any)}
                  style={{
                    padding: 20,
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${interactiveType === type ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: interactiveType === type ? 'rgba(99,102,241,0.08)' : 'var(--color-bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon
                    size={28}
                    style={{
                      margin: '0 auto 10px',
                      color: interactiveType === type ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    }}
                  />
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs text-secondary" style={{ marginTop: 4 }}>{desc}</div>
                </div>
              ))}
            </div>

            {interactiveType === 'button' && (
              <div className="card" style={{ background: 'var(--color-bg-primary)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <h4 className="font-semibold text-sm">Configure Buttons</h4>
                  {buttons.length < 3 && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setButtons([...buttons, { type: 'reply', displayText: `Option ${buttons.length + 1}` }])}>
                      <Plus size={14} /> Add Button
                    </button>
                  )}
                </div>
                {buttons.map((btn, idx) => (
                  <div key={idx} className="flex gap-2 items-center" style={{ marginBottom: 8 }}>
                    <select className="input" style={{ width: 120 }} value={btn.type} onChange={(e) => { const u = [...buttons]; u[idx].type = e.target.value as any; setButtons(u); }}>
                      <option value="url">URL Link</option>
                      <option value="reply">Quick Reply</option>
                      <option value="call">Call</option>
                    </select>
                    <input type="text" className="input" placeholder="Button Text (e.g. Tap Continue)" value={btn.displayText} onChange={(e) => { const u = [...buttons]; u[idx].displayText = e.target.value; setButtons(u); }} />
                    <input type="text" className="input" placeholder={btn.type === 'url' ? 'URL (https://...)' : btn.type === 'call' ? 'Phone Number' : 'Payload ID'} value={btn.idOrUrl || ''} onChange={(e) => { const u = [...buttons]; u[idx].idOrUrl = e.target.value; setButtons(u); }} />
                    <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)', flexShrink: 0 }} onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {interactiveType === 'slider' && (
              <div className="card" style={{ background: 'var(--color-bg-primary)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <h4 className="font-semibold text-sm">eCommerce Slider Cards</h4>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSliderItems([...sliderItems, { title: `Product ${sliderItems.length + 1}`, price: '$19.99', buttonText: 'Explore' }])}>
                    <Plus size={14} /> Add Card
                  </button>
                </div>
                {sliderItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: 8, marginBottom: 8 }}>
                    <input type="text" className="input" placeholder="Product Title" value={item.title} onChange={(e) => { const u = [...sliderItems]; u[idx].title = e.target.value; setSliderItems(u); }} />
                    <input type="text" className="input" placeholder="Price ($49.99)" value={item.price || ''} onChange={(e) => { const u = [...sliderItems]; u[idx].price = e.target.value; setSliderItems(u); }} />
                    <input type="text" className="input" placeholder="Button Text" value={item.buttonText || ''} onChange={(e) => { const u = [...sliderItems]; u[idx].buttonText = e.target.value; setSliderItems(u); }} />
                    <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)', flexShrink: 0 }} onClick={() => setSliderItems(sliderItems.filter((_, i) => i !== idx))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Schedule ── */}
        {step === 4 && (
          <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
            {/* Summary */}
            <div
              style={{
                background: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                marginBottom: 24,
                border: '1px solid var(--color-border)',
              }}
            >
              <h4 className="font-semibold text-sm" style={{ marginBottom: 12 }}>📋 Campaign Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Campaign Name', value: name || '—' },
                  { label: 'Target Audience', value: selectedGroups.length === 0 ? `All Contacts (${totalContacts})` : selectedGroups.join(', ') },
                  { label: 'Message Length', value: `${templateText.length} characters` },
                  { label: 'Interactive Type', value: interactiveType === 'none' ? 'Standard Text' : interactiveType === 'button' ? `Buttons (${buttons.length})` : `eCommerce Slider (${sliderItems.length} cards)` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs text-secondary">{label}</div>
                    <div className="font-medium text-sm" style={{ marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <label className="label font-semibold">Dispatch Options</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, marginBottom: 20 }}>
              <div
                onClick={() => setSendOption('now')}
                style={{
                  padding: 20,
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${sendOption === 'now' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: sendOption === 'now' ? 'rgba(99,102,241,0.08)' : 'var(--color-bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="flex items-center gap-3">
                  <Send size={22} style={{ color: sendOption === 'now' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
                  <div>
                    <div className="font-semibold text-sm">Send Immediately</div>
                    <div className="text-xs text-secondary">Start dispatching right now</div>
                  </div>
                </div>
              </div>
              <div
                onClick={() => setSendOption('schedule')}
                style={{
                  padding: 20,
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${sendOption === 'schedule' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: sendOption === 'schedule' ? 'rgba(99,102,241,0.08)' : 'var(--color-bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={22} style={{ color: sendOption === 'schedule' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
                  <div>
                    <div className="font-semibold text-sm">Schedule for Later</div>
                    <div className="text-xs text-secondary">Pick a date and time</div>
                  </div>
                </div>
              </div>
            </div>

            {sendOption === 'schedule' && (
              <div style={{ marginBottom: 20 }}>
                <label className="label">Dispatch Date & Time</label>
                <input
                  type="datetime-local"
                  className="input"
                  style={{ maxWidth: 300 }}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            )}

            {totalContacts > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#22c55e',
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Users size={16} />
                Ready to send to <strong>&nbsp;{totalContacts}&nbsp;</strong> contacts
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
          <button
            className="btn btn-secondary flex items-center gap-2"
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/campaigns')}
          >
            <ArrowLeft size={16} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={() => {
                if (step === 1 && !name.trim()) { setError('Please enter a campaign name.'); return; }
                if (step === 2 && !templateText.trim()) { setError('Please write a message template.'); return; }
                setError(null);
                setStep(step + 1);
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {sendOption === 'now' ? <Send size={16} /> : <Calendar size={16} />}
              {submitting ? 'Creating...' : sendOption === 'now' ? 'Launch Campaign' : 'Schedule Campaign'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
