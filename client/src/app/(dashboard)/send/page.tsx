'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { sendApi } from '@/lib/api';
import { Send, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react';

type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document';

const TYPE_OPTIONS: { value: MessageType; label: string; accept?: string }[] = [
  { value: 'text', label: 'Text' },
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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      if (type === 'text') {
        await sendApi.text(to.trim(), text.trim());
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
      <Header title="Send Message" subtitle="Send WhatsApp messages directly" />
      <div className="page-content">
        <div style={{ maxWidth: 560 }}>
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

              {/* Text content */}
              {type === 'text' ? (
                <div className="input-group">
                  <label className="input-label" htmlFor="send-text">Message</label>
                  <textarea
                    id="send-text"
                    className="input"
                    placeholder="Type your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
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
