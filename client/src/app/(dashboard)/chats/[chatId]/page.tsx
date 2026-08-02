'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatsApi } from '@/lib/api';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = decodeURIComponent(params.chatId as string);
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const [chatRes, msgsRes] = await Promise.all([
          chatsApi.get(chatId),
          chatsApi.getMessages(chatId, { page, limit: 50 }),
        ]);
        setChat(chatRes.data);
        setMessages(msgsRes.data);
        setPagination(msgsRes.pagination);
        await chatsApi.markRead(chatId);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [chatId, page]);

  useEffect(() => {
    if (page === 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, page]);

  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteMsgId) return;
    await chatsApi.deleteMessage(deleteMsgId);
    setMessages((prev) => prev.map((m) => m.msgId === deleteMsgId ? { ...m, isDeleted: true } : m));
    setDeleteMsgId(null);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { image: '🖼️', video: '🎥', audio: '🎵', document: '📄', sticker: '🎨' };
    return icons[type] || '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'var(--color-bg)',
        flexShrink: 0,
      }}>
        <Link href="/chats" className="btn btn-ghost btn-icon" id="chat-back">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="font-semibold text-sm">{chat?.name || chatId}</div>
          <div className="text-xs text-secondary">
            {chat?.isGroup ? `${chat.participants?.length || 0} members` : chatId}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {chat?.unreadCount > 0 && (
            <span className="badge badge-accent">{chat.unreadCount} unread</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : (
          <>
            {pagination?.hasPrev && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <button
                  id="messages-load-more"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => p + 1)}
                >
                  Load earlier messages
                </button>
              </div>
            )}

            <div className="messages-container">
              {messages.map((msg) => (
                <div
                  key={msg.msgId}
                  className={`message-row ${msg.fromMe ? 'from-me' : 'from-them'}`}
                  id={`msg-${msg.msgId}`}
                >
                  <div className={`message-bubble ${msg.fromMe ? 'from-me' : 'from-them'} ${msg.isDeleted ? 'deleted' : ''}`}>
                    {msg.isDeleted ? (
                      <em style={{ opacity: 0.6 }}>Message deleted</em>
                    ) : (
                      <>
                        {msg.type !== 'text' && (
                          <div style={{ marginBottom: 4, fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                            {getTypeIcon(msg.type)} {msg.type}
                          </div>
                        )}
                        {msg.text && <div>{msg.text}</div>}
                        {msg.caption && <div>{msg.caption}</div>}
                        {!msg.text && !msg.caption && msg.type !== 'text' && (
                          <div style={{ opacity: 0.7 }}>[{msg.mediaFileName || msg.type}]</div>
                        )}
                      </>
                    )}
                    <div className="message-time">
                      {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                      {msg.fromMe && msg.status === 'read' ? ' ✓✓' : msg.fromMe && ' ✓'}
                    </div>
                  </div>
                  {!msg.isDeleted && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ opacity: 0, transition: 'opacity 200ms', marginLeft: 4, alignSelf: 'center' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                      onClick={() => setDeleteMsgId(msg.msgId)}
                      title="Delete locally"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <Modal
        isOpen={!!deleteMsgId}
        onClose={() => setDeleteMsgId(null)}
        title="Delete Message"
        description="Are you sure you want to delete this message locally from the database?"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
