'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { chatbotApi } from '@/lib/api';
import ChatflowBuilder, { FlowNode } from '@/components/chatbot/ChatflowBuilder';
import {
  Bot, Layers, CheckCircle2, RefreshCw, Smartphone,
  Sparkles, Zap, ArrowRight, ShoppingBag, Truck, UserCheck, Sliders
} from 'lucide-react';

const PRESETS: Record<string, { name: string; desc: string; icon: any; flows: FlowNode[] }> = {
  ecommerce: {
    name: 'Urban Studioz E-Commerce',
    desc: 'Welcome greeting, product catalog cards, order lookup, and live stylist handoff.',
    icon: ShoppingBag,
    flows: [
      {
        id: 'node-start',
        type: 'flowStart',
        title: 'Flow Start',
        content: 'Triggered when visitor sends one of these keywords',
        triggers: ['Hi', 'Hello', 'Menu', 'Studio', 'Urban', 'Shop'],
        x: 40,
        y: 160,
      },
      {
        id: 'node-media',
        type: 'mediaButtons',
        title: 'Media + Buttons',
        subtitle: 'Urban Studioz Welcome',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        content: 'Welcome to Urban Studioz 👋\n\nExplore our latest collections, track active orders, or chat with our design specialists.',
        buttons: [
          { id: 'b1', label: '🛍️ Shop Collections', targetNodeId: 'node-catalog' },
          { id: 'b2', label: '📦 Track Order', targetNodeId: 'node-order' },
          { id: 'b3', label: '💬 Talk to Agent', targetNodeId: 'node-agent' },
        ],
        x: 360,
        y: 60,
      },
      {
        id: 'node-catalog',
        type: 'message',
        title: 'Collections & Products',
        imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80',
        content: 'Here are this week’s featured Urban Studioz items. Tap below to browse catalog or get personalized recommendations:',
        buttons: [
          { id: 'b4', label: '🔥 View Best Sellers', targetNodeId: 'node-media' },
          { id: 'b5', label: '💬 Speak with Stylist', targetNodeId: 'node-agent' },
        ],
        x: 740,
        y: 40,
      },
      {
        id: 'node-order',
        type: 'message',
        title: 'Order Status & Tracking',
        content: 'Please reply with your 6-digit Order ID (e.g. #US-4892) to view live dispatch status and estimated courier delivery.',
        buttons: [
          { id: 'b6', label: 'Need Help?', targetNodeId: 'node-agent' },
          { id: 'b7', label: 'Back to Main Menu', targetNodeId: 'node-media' },
        ],
        x: 740,
        y: 280,
      },
      {
        id: 'node-agent',
        type: 'requestIntervention',
        title: 'Human Support Agent',
        content: 'An Urban Studioz representative will connect with you in this chat in under 2 minutes.',
        buttons: [],
        x: 740,
        y: 480,
      },
    ],
  },
  support: {
    name: 'Order Tracking & Support',
    desc: 'Instant self-service order lookup, courier tracking, and agent intervention.',
    icon: Truck,
    flows: [
      {
        id: 'node-start',
        type: 'flowStart',
        title: 'Flow Start',
        content: 'Triggered when visitor asks for support',
        triggers: ['Help', 'Support', 'Order', 'Track', 'Status'],
        x: 40,
        y: 160,
      },
      {
        id: 'node-media',
        type: 'mediaButtons',
        title: 'Support Center',
        subtitle: 'Urban Studioz Helpdesk',
        imageUrl: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=600&q=80',
        content: 'Urban Studioz Support Desk 🛎️\n\nHow can we help you today?',
        buttons: [
          { id: 's1', label: '📦 Where is my Order?', targetNodeId: 'node-order-lookup' },
          { id: 's2', label: '🔄 Returns & Refunds', targetNodeId: 'node-returns' },
          { id: 's3', label: '🧑‍💻 Live Agent Support', targetNodeId: 'node-live-agent' },
        ],
        x: 360,
        y: 60,
      },
      {
        id: 'node-order-lookup',
        type: 'message',
        title: 'Order Lookup',
        content: 'Please send your Order Number or phone number used during checkout to receive immediate tracking info.',
        buttons: [
          { id: 's4', label: 'Main Menu', targetNodeId: 'node-media' },
        ],
        x: 740,
        y: 40,
      },
      {
        id: 'node-returns',
        type: 'message',
        title: 'Returns & Exchange',
        content: 'We offer 7-day hassle-free returns. Ensure tags are attached and reply with "RETURN" followed by your order ID.',
        buttons: [
          { id: 's5', label: 'Request Agent Help', targetNodeId: 'node-live-agent' },
        ],
        x: 740,
        y: 240,
      },
      {
        id: 'node-live-agent',
        type: 'requestIntervention',
        title: 'Request Intervention',
        content: 'Connecting you with an Urban Studioz support manager...',
        buttons: [],
        x: 740,
        y: 440,
      },
    ],
  },
  booking: {
    name: 'VIP Studio Appointment',
    desc: 'Schedule in-person stylist consultations, private fittings, or showroom visits.',
    icon: UserCheck,
    flows: [
      {
        id: 'node-start',
        type: 'flowStart',
        title: 'Flow Start',
        content: 'Triggered for appointment booking',
        triggers: ['Book', 'Appointment', 'Visit', 'Fitting', 'Consultation'],
        x: 40,
        y: 160,
      },
      {
        id: 'node-media',
        type: 'mediaButtons',
        title: 'VIP Studio Booking',
        subtitle: 'Urban Studioz Private Session',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
        content: 'Reserve your personalized styling appointment at Urban Studioz ✨',
        buttons: [
          { id: 'v1', label: '📅 Book This Weekend', targetNodeId: 'node-slots' },
          { id: 'v2', label: '📍 Showroom Location', targetNodeId: 'node-location' },
          { id: 'v3', label: '💬 Talk with Concierge', targetNodeId: 'node-concierge' },
        ],
        x: 360,
        y: 60,
      },
      {
        id: 'node-slots',
        type: 'message',
        title: 'Available Slots',
        content: 'Sessions are 45 minutes with a senior stylist. Please reply with your preferred Day and Time (e.g. Saturday 3 PM).',
        buttons: [
          { id: 'v4', label: 'Confirm with Concierge', targetNodeId: 'node-concierge' },
        ],
        x: 740,
        y: 40,
      },
      {
        id: 'node-location',
        type: 'message',
        title: 'Showroom Location',
        content: 'Urban Studioz flagship store: 42 Fashion Blvd, Design District. Free valet parking available.',
        buttons: [
          { id: 'v5', label: 'Book Appointment', targetNodeId: 'node-slots' },
        ],
        x: 740,
        y: 240,
      },
      {
        id: 'node-concierge',
        type: 'requestIntervention',
        title: 'VIP Concierge',
        content: 'Our VIP concierge will confirm your session details momentarily.',
        buttons: [],
        x: 740,
        y: 440,
      },
    ],
  },
};

export default function UrbanStudiozChatbotPage() {
  const [config, setConfig] = useState<any>(null);
  const [activePreset, setActivePreset] = useState<string>('ecommerce');
  const [currentFlows, setCurrentFlows] = useState<FlowNode[]>(PRESETS.ecommerce.flows);
  const [replySource, setReplySource] = useState<'nocode' | 'standard' | 'off'>('nocode');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await chatbotApi.get();
      if (res.data) {
        setConfig(res.data);
        setReplySource((res.data.whatsappEnabled ?? res.data.enabled) ? 'nocode' : 'off');
        const whatsappFlows = res.data.whatsappFlows || res.data.flows;
        if (whatsappFlows && whatsappFlows.length > 0) {
          setCurrentFlows(whatsappFlows);
        }
      }
    } catch (err: any) {
      console.error('Failed to load chatbot configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    const selected = PRESETS[presetKey];
    if (!selected) return;
    setActivePreset(presetKey);
    setCurrentFlows(selected.flows);
    setMessage({ type: 'success', text: `Loaded "${selected.name}" template. Click "Save & Deploy Flow" to activate.` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateReplySource = async (newSource: 'nocode' | 'standard' | 'off') => {
    setReplySource(newSource);
    try {
      await chatbotApi.update({
        whatsappEnabled: newSource !== 'off',
        replySource: newSource,
        ...config,
        whatsappFlows: currentFlows,
      });
      setMessage({
        type: 'success',
        text: newSource === 'nocode'
          ? '⚡ Switched to No-Code Visual Chatflow Engine!'
          : newSource === 'standard'
          ? '🤖 Switched to Standard Rules & AI Knowledge Base!'
          : '⏸️ Automated WhatsApp replies turned off.',
      });
      setTimeout(() => setMessage(null), 3500);
    } catch {
      setMessage({ type: 'error', text: 'Failed to update reply engine.' });
    }
  };

  const handleSaveFlows = async (flows: FlowNode[]) => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        whatsappEnabled: true,
        replySource: 'nocode',
        botName: config?.botName || 'Urban Studioz Bot',
        primaryColor: config?.primaryColor || '#16A34A',
        ...config,
        whatsappFlows: flows,
      };

      const res = await chatbotApi.update(payload);
      if (res.success) {
        setConfig(res.data);
        setCurrentFlows(flows);
        setReplySource('nocode');
        setMessage({ type: 'success', text: 'No-Code Chatflow successfully deployed to WhatsApp!' });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save chatflow.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        title="WhatsApp Chatbot"
        subtitle="Visual WhatsApp automation flow builder and testing simulator"
      />

      <div className="page-content">
        {/* ── WhatsApp automation controls ── */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: 16,
          padding: '18px 24px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                WhatsApp Automation
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: replySource === 'nocode' ? '#16a34a' : replySource === 'standard' ? '#2563eb' : '#64748b',
                background: replySource === 'nocode' ? '#f0fdf4' : replySource === 'standard' ? '#eff6ff' : '#f1f5f9',
                padding: '2px 10px',
                borderRadius: 9999,
                border: '1px solid ' + (replySource === 'nocode' ? '#bbf7d0' : replySource === 'standard' ? '#bfdbfe' : '#e2e8f0'),
              }}>
                {replySource === 'nocode' ? '⚡ No-Code Flow Active' : replySource === 'standard' ? '🤖 Rules & AI Knowledge Active' : '⏸️ Auto-Replies Turned Off'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Control automated replies for WhatsApp independently from the website chatbot.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleUpdateReplySource('nocode')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: replySource === 'nocode' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                background: replySource === 'nocode' ? '#f0fdf4' : '#ffffff',
                color: replySource === 'nocode' ? '#16a34a' : '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={14} />
              <span>No-Code Flow Builder</span>
              {replySource === 'nocode' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => handleUpdateReplySource('standard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: replySource === 'standard' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: replySource === 'standard' ? '#eff6ff' : '#ffffff',
                color: replySource === 'standard' ? '#2563eb' : '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={14} />
              <span>Standard Rules (/chatbot)</span>
              {replySource === 'standard' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => handleUpdateReplySource('off')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: replySource === 'off' ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                background: replySource === 'off' ? '#0f172a' : '#ffffff',
                color: replySource === 'off' ? '#ffffff' : '#475569',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Turn Off</span>
            </button>
          </div>
        </div>
        {/* Top Control & Preset Selector Bar */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '18px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                No-Code Flow Templates
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#16a34a',
                background: '#f0fdf4',
                padding: '2px 8px',
                borderRadius: 9999,
                border: '1px solid #bbf7d0',
              }}>
                1-Click Load
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Choose a starter flow or drag &amp; drop your custom nodes on the canvas below.
            </div>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(PRESETS).map(([key, item]) => {
              const Icon = item.icon;
              const isCurrent = activePreset === key;
              return (
                <button
                  key={key}
                  onClick={() => handleApplyPreset(key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: isCurrent ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    background: isCurrent ? '#0f172a' : '#ffffff',
                    color: isCurrent ? '#ffffff' : '#475569',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Toast */}
        {message && (
          <div style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Main Visual Chatflow Builder Component */}
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 400,
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            color: '#64748b',
            gap: 10,
          }}>
            <RefreshCw size={20} className="animate-spin" />
            <span>Loading Urban Studioz Chatflow...</span>
          </div>
        ) : (
          <ChatflowBuilder
            key={activePreset}
            initialFlows={currentFlows}
            botName="Urban Studioz"
            primaryColor="#16A34A"
            onSave={handleSaveFlows}
            saving={saving}
          />
        )}
      </div>
    </>
  );
}
