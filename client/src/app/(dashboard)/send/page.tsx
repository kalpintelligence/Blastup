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

  // Button interactive state
  const [buttonText, setButtonText] = useState('Tap Continue');
  const [buttonUrl, setButtonUrl] = useState('https://example.com/continue');

  // Slider interactive state
  const [sliderTitle, setSliderTitle] = useState('Exclusive Product Catalog');
  const [item1Title, setItem1Title] = useState('Wireless Noise-Cancelling Headphones');
  const [item1Price, setItem1Price] = useState('$129.99');
  const [item2Title, setItem2Title] = useState('Smart Fitness Watch Pro');
  const [item2Price, setItem2Price] = useState('$89.99');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

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
          text.trim() || 'Tap Continue below to access your customized link:',
          [
            { type: 'url', displayText: buttonText.trim(), idOrUrl: buttonUrl.trim() },
            { type: 'reply', displayText: 'More Options', idOrUrl: 'opt_more' },
          ],
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

              {/* Button customization */}
              {type === 'button' && (
                <div className="card" style={{ background: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <MousePointerClick size={16} className="text-accent" />
                    <span>WhatsApp Tap Continue Button Options</span>
                  </div>
                  <div>
                    <label className="input-label">Button Action Label</label>
                    <input
                      type="text"
                      className="input"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="e.g. Tap Continue"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Destination URL</label>
                    <input
                      type="url"
                      className="input"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://..."
                      required
                    />
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
