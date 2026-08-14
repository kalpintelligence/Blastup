'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { sendApi } from '@/lib/api';
import { Send, CheckCircle2, AlertCircle, Paperclip, MousePointerClick, ShoppingBag } from 'lucide-react';

type MessageType = 'text' | 'button' | 'slider' | 'image' | 'video' | 'audio' | 'document';

const TYPE_OPTIONS: { value: MessageType; label: string; accept?: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'button', label: 'Button (Tap Continue)' },
  { value: 'slider', label: 'eCommerce Slider' },
  { value: 'image', label: 'Image', accept: 'image/*' },
  { value: 'video', label: 'Video', accept: 'video/*' },
  { value: 'audio', label: 'Audio', accept: 'audio/*' },
  { value: 'document', label: 'Document', accept: '.pdf,.doc,.docx,.txt,.csv' },
];

export default function SendPage() {
  const [type, setType] = useState<MessageType>('text');
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [footer, setFooter] = useState('Blastup Automation');
  const [file, setFile] = useState<File | null>(null);

  // Dynamic Button interactive state
  const [customButtons, setCustomButtons] = useState<Array<{ type: 'reply' | 'url' | 'call'; displayText: string; idOrUrl?: string }>>([
    { type: 'reply', displayText: '🛍️ Shop Collections', idOrUrl: 'shop_now' },
    { type: 'reply', displayText: '📦 Track Order', idOrUrl: 'track_order' },
    { type: 'reply', displayText: '💬 Talk to Agent', idOrUrl: 'talk_agent' },
  ]);

  // Slider interactive state
  const [sliderTitle, setSliderTitle] = useState('Exclusive Product Catalog');
  const [item1Title, setItem1Title] = useState('Wireless Noise-Cancelling Headphones');
  const [item1Price, setItem1Price] = useState('$129.99');
  const [item2Title, setItem2Title] = useState('Smart Fitness Watch Pro');
  const [item2Price, setItem2Price] = useState('$89.99');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAddCustomButton = () => {
    if (customButtons.length >= 3) return;
    setCustomButtons([...customButtons, { type: 'reply', displayText: `Option ${customButtons.length + 1}`, idOrUrl: `btn_${Date.now()}` }]);
  };

  const handleRemoveCustomButton = (idx: number) => {
    setCustomButtons(customButtons.filter((_, i) => i !== idx));
  };

  const handleUpdateButton = (idx: number, field: string, value: string) => {
    const updated = [...customButtons];
    (updated[idx] as any)[field] = value;
    setCustomButtons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      if (type === 'text') {
        await sendApi.text(to.trim(), text.trim());
      } else if (type === 'button') {
        await sendApi.button(
          to.trim(),
          text.trim() || 'Welcome! 👋 Select an option below to proceed:',
          customButtons.map(b => ({
            type: b.type,
            displayText: b.displayText.trim() || 'Option',
            idOrUrl: b.idOrUrl?.trim() || `btn_${Date.now()}`,
          })),
          footer
        );
      } else if (type === 'slider') {
        await sendApi.slider(
          to.trim(),
          sliderTitle,
          text.trim() || 'Check out our top-selling items for this month:',
          [
            { title: item1Title, price: item1Price, description: 'Best-in-class audio experience', buttonText: 'Buy Now' },
            { title: item2Title, price: item2Price, description: 'Track your health and daily goals', buttonText: 'Learn More' },
          ],
          footer
        );
      } else {
        if (!file) throw new Error('Please select a file');
        const fd = new FormData();
        fd.append('to', to.trim());
        fd.append('file', file);
        if (caption) fd.append('caption', caption.trim());
        await sendApi.media(type, fd);
      }
      setResult({ success: true, message: 'Message sent successfully!' });
      setText('');
      setCaption('');
      setFile(null);
    } catch (err: any) {
      setResult({ success: false, message: err?.data?.message || err?.message || 'Failed to send message' });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type)!;

  return (
    <>
      <Header title="Send Message" subtitle="Send WhatsApp messages, customizable buttons & eCommerce sliders" />
      <div className="page-content">
        <div style={{ maxWidth: 640 }}>
          <div className="card">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Type selector */}
              <div className="input-group">
                <label className="input-label">Message Type</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      id={`send-type-${opt.value}`}
                      className={`btn btn-sm ${type === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => { setType(opt.value); setFile(null); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* To */}
              <div className="input-group">
                <label className="input-label" htmlFor="send-to">Recipient Number</label>
                <input
                  id="send-to"
                  type="text"
                  className="input"
                  placeholder="919876543210"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
                <span className="input-helper">International format without +. E.g. 919876543210</span>
              </div>

              {/* Interactive Multi-Buttons Customization */}
              {type === 'button' && (
                <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: '#0f172a' }}>
                      <MousePointerClick size={16} className="text-accent" />
                      <span>WhatsApp Interactive Action Buttons (Max 3)</span>
                    </div>
                    {customButtons.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddCustomButton}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                      >
                        + Add Button
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {customButtons.map((btn, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                            Button {idx + 1}
                          </span>
                          {customButtons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomButton(idx)}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="input-label" style={{ fontSize: 11 }}>Button Label</label>
                            <input
                              type="text"
                              className="input"
                              value={btn.displayText}
                              onChange={(e) => handleUpdateButton(idx, 'displayText', e.target.value)}
                              placeholder="e.g. 🛍️ Shop Now"
                              required
                            />
                          </div>

                          <div>
                            <label className="input-label" style={{ fontSize: 11 }}>Button Type</label>
                            <select
                              className="input"
                              value={btn.type}
                              onChange={(e) => handleUpdateButton(idx, 'type', e.target.value)}
                            >
                              <option value="reply">Quick Reply (Triggers Flow)</option>
                              <option value="url">URL Link</option>
                              <option value="call">Call Phone</option>
                            </select>
                          </div>
                        </div>

                        {btn.type !== 'reply' && (
                          <div>
                            <label className="input-label" style={{ fontSize: 11 }}>
                              {btn.type === 'url' ? 'Destination URL (https://...)' : 'Phone Number (+91...)'}
                            </label>
                            <input
                              type="text"
                              className="input"
                              value={btn.idOrUrl || ''}
                              onChange={(e) => handleUpdateButton(idx, 'idOrUrl', e.target.value)}
                              placeholder={btn.type === 'url' ? 'https://example.com' : '+919876543210'}
                              required
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slider customization */}
              {type === 'slider' && (
                <div className="card" style={{ background: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShoppingBag size={16} className="text-accent" />
                    <span>eCommerce Carousel Cards</span>
                  </div>
                  <div>
                    <label className="input-label">Catalog Title</label>
                    <input
                      type="text"
                      className="input"
                      value={sliderTitle}
                      onChange={(e) => setSliderTitle(e.target.value)}
                      placeholder="Showcase Title"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="input-label">Product 1 Title</label>
                      <input type="text" className="input" value={item1Title} onChange={(e) => setItem1Title(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Price</label>
                      <input type="text" className="input" value={item1Price} onChange={(e) => setItem1Price(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="input-label">Product 2 Title</label>
                      <input type="text" className="input" value={item2Title} onChange={(e) => setItem2Title(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Price</label>
                      <input type="text" className="input" value={item2Price} onChange={(e) => setItem2Price(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Text content */}
              {(type === 'text' || type === 'button' || type === 'slider') ? (
                <div className="input-group">
                  <label className="input-label" htmlFor="send-text">Main Body Message</label>
                  <textarea
                    id="send-text"
                    className="input"
                    placeholder="Type your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required={type === 'text'}
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <label className="input-label" htmlFor="send-file">File</label>
                    <label
                      id="send-file-label"
                      htmlFor="send-file"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', transition: 'border-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    >
                      <Paperclip size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-sm text-secondary">
                        {file ? file.name : `Choose ${selectedType.label.toLowerCase()} file`}
                      </span>
                    </label>
                    <input
                      id="send-file"
                      type="file"
                      accept={selectedType.accept}
                      style={{ display: 'none' }}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="send-caption">Caption (optional)</label>
                    <input
                      id="send-caption"
                      type="text"
                      className="input"
                      placeholder="Add a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Result */}
              {result && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderRadius: 'var(--radius-md)', border: '1px solid',
                    background: result.success ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    borderColor: result.success ? 'var(--color-success)' : 'var(--color-error)',
                    color: result.success ? 'var(--color-success)' : 'var(--color-error)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {result.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {result.message}
                </div>
              )}

              <button
                id="send-submit"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ justifyContent: 'center' }}
              >
                {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
