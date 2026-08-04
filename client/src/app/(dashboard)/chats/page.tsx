'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import { chatsApi, sendApi } from '@/lib/api';
import { SkeletonChatRow, Shimmer } from '@/components/ui/Skeleton';
import { Search, Filter, MessageSquare, Send, CheckCheck, Phone, ShieldCheck, MoreVertical } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { formatPhoneNumber } from '@/lib/format';

export default function ChatsPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Composer state
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch all chats
  const fetchChats = async () => {
    try {
      const res = await chatsApi.list({ page: 1, limit: 50, search: search || undefined, unreadOnly });
      setChats(res.data);
      if (!selectedChat && res.data.length > 0) {
        setSelectedChat(res.data[0]);
      }
    } catch {
      // silent catch
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchChats, 300);
    return () => clearTimeout(timer);
  }, [search, unreadOnly]);

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const msgsRes = await chatsApi.getMessages(selectedChat.chatId, { page: 1, limit: 100 });
        setMessages(msgsRes.data);
        await chatsApi.markRead(selectedChat.chatId);
      } catch {
        // silent catch
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedChat?.chatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Quick Reply Submission
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat || sending) return;

    const textToSend = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      await sendApi.text(selectedChat.chatId, textToSend);
      // Append local message placeholder immediately
      const newMsg = {
        msgId: 'temp_' + Date.now(),
        fromMe: true,
        text: textToSend,
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getChatDisplayName = (chat: any) => {
    if (!chat) return 'WhatsApp Contact';
    if (chat.name && chat.name !== '[unknown]' && chat.name !== 'unknown') return chat.name;
    if (chat.pushName && chat.pushName !== '[unknown]' && chat.pushName !== 'unknown') return chat.pushName;
    return formatPhoneNumber(chat.chatId || chat.jid || chat.phone);
  };

  const formatMessageContent = (msg: any) => {
    if (!msg) return 'No messages yet';
    const text = typeof msg === 'string' ? msg : msg.text || msg.caption || msg.content;
    if (text && text !== '[unknown]' && text !== 'unknown') return text;

    const type = ((typeof msg === 'object' && msg.type) || '').toLowerCase();
    switch (type) {
      case 'image': return '📷 Photo';
      case 'video': return '🎥 Video';
      case 'audio': return '🎵 Voice message';
      case 'document': return '📄 Document';
      case 'sticker': return '🎨 Sticker';
      case 'location': return '📍 Location';
      case 'button': return '⚡ Interactive message';
      case 'slider': return '🛒 Product slider';
      default: return '💬 Message';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name || name === '[unknown]' || name === 'unknown') return '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <>
      <Header title="WhatsApp Web Console" subtitle="Unified real-time messaging console" />
      
      <div className="whatsapp-split-pane">
        {/* Left Pane: Chat Conversations List */}
        <div className="chats-sidebar">
          <div className="chats-search-bar">
            <div className="search-wrapper" style={{ flex: 1 }}>
              <Search className="search-icon" />
              <input
                id="chats-search"
                type="text"
                className="search-input"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              id="chats-filter-unread"
              className={`btn btn-sm ${unreadOnly ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setUnreadOnly(!unreadOnly)}
              title="Filter unread chats"
            >
              <Filter size={12} />
            </button>
          </div>

          <div className="chats-list">
            {loadingChats ? (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonChatRow key={i} />
                ))}
              </>
            ) : chats.length === 0 ? (
              <div className="empty-state">
                <MessageSquare />
                <p>No chats found.</p>
              </div>
            ) : (
              chats.map((chat) => {
                const isActive = selectedChat?.chatId === chat.chatId;
                return (
                  <div
                    key={chat.chatId}
                    className={`chat-row-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedChat(chat)}
                    id={`chat-${chat.chatId}`}
                  >
                    <div className="chat-avatar">
                      {chat.profilePicUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={chat.profilePicUrl} alt={getChatDisplayName(chat)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(getChatDisplayName(chat))
                      )}
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">{getChatDisplayName(chat)}</div>
                      <div className="chat-preview">
                        {chat.lastMessage?.fromMe && 'You: '}
                        {formatMessageContent(chat.lastMessage)}
                      </div>
                    </div>
                    <div className="chat-meta">
                      {chat.lastMessage?.timestamp && (
                        <div className="chat-time">
                          {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: false })}
                        </div>
                      )}
                      {chat.unreadCount > 0 && (
                        <div className="chat-unread">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: WhatsApp Chat Window */}
        {selectedChat ? (
          <div className="chat-window">
            {/* Header */}
            <div className="chat-window-header">
              <div className="flex items-center gap-3">
                <div className="chat-avatar" style={{ width: 40, height: 40 }}>
                  {selectedChat.profilePicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedChat.profilePicUrl} alt={selectedChat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(selectedChat.name || formatPhoneNumber(selectedChat.chatId))
                  )}
                </div>
                <div>
                  <div className="font-serif font-bold text-sm">{selectedChat.name || formatPhoneNumber(selectedChat.chatId)}</div>
                  <div className="text-xs text-secondary flex items-center gap-1">
                    <Phone size={10} />
                    <span>{formatPhoneNumber(selectedChat.chatId)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge badge-success flex items-center gap-1">
                  <ShieldCheck size={12} /> End-to-End Encrypted
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="chat-window-messages">
              {loadingMessages ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 24px' }}>
                  {/* Skeleton message bubbles */}
                  {[65, 45, 75, 50, 60].map((w, i) => (
                    <div key={i} className={`message-row ${i % 2 === 0 ? 'from-them' : 'from-me'}`}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Shimmer width={`${w}%`} height={38} radius={i % 2 === 0 ? '0 12px 12px 12px' : '12px 0 12px 12px'} style={{ maxWidth: 280 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <p>No messages in this chat yet. Send a message below!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.msgId}
                    className={`message-row ${msg.fromMe ? 'from-me' : 'from-them'}`}
                  >
                    <div className={`message-bubble ${msg.fromMe ? 'from-me' : 'from-them'}`}>
                      <div>{formatMessageContent(msg)}</div>
                      <span className="message-time-stamp">
                        {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                        {msg.fromMe && <CheckCheck size={13} style={{ color: '#53bdeb' }} />}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Bottom Message Composer */}
            <form onSubmit={handleSendReply} className="chat-window-composer">
              <input
                type="text"
                className="chat-composer-input"
                placeholder={`Type a message to ${selectedChat.name || selectedChat.chatId}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!replyText.trim() || sending}
                style={{ borderRadius: 'var(--radius-pill)', padding: '10px 16px' }}
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="chat-welcome-placeholder">
            <MessageSquare size={48} style={{ color: 'var(--color-primary)', marginBottom: 16 }} />
            <h2 className="font-serif font-bold text-lg" style={{ marginBottom: 6 }}>Blastup Console</h2>
            <p className="text-sm text-secondary" style={{ maxWidth: 320 }}>
              Select a conversation from the left menu to view messages and send real-time replies.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
