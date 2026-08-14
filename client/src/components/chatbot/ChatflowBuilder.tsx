'use client';

import React, { useState, useRef, useEffect } from 'react';
import { whatsappApi } from '@/lib/api';
import {
  Sparkles, Plus, Trash2, Save, CheckCheck, RefreshCw,
  Move, Send, ArrowRight, Bot,
  MessageSquare, UserCheck, HelpCircle, Check, X,
  Smartphone, ZoomIn, ZoomOut, Play, ChevronRight, Layers,
  FileImage
} from 'lucide-react';

export interface FlowNodeButton {
  id: string;
  label: string;
  targetNodeId?: string;
}

export interface FlowNode {
  id: string;
  type: 'flowStart' | 'mediaButtons' | 'message' | 'requestIntervention';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  content: string;
  triggers?: string[];
  buttons?: FlowNodeButton[];
  x: number;
  y: number;
}

interface ChatflowBuilderProps {
  initialFlows?: FlowNode[];
  botName: string;
  primaryColor?: string;
  onSave: (flows: FlowNode[]) => Promise<void>;
  saving?: boolean;
}

const RANDOM_PREVIEW_NAMES = [
  'Urban Studioz',
  'Aura Apparel',
  'Nova Luxe',
  'Nexus Studio',
  'Verve Commerce',
  'Zenith Studio',
  'Kova Atelier',
];

const DEFAULT_FLOWS: FlowNode[] = [
  {
    id: 'node-start',
    type: 'flowStart',
    title: 'Flow Start',
    content: 'Triggered when visitor sends one of these keywords',
    triggers: ['Hi', 'Hello', 'Help'],
    x: 40,
    y: 160,
  },
  {
    id: 'node-media',
    type: 'mediaButtons',
    title: 'Media + Buttons',
    subtitle: 'Headway 225',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    content: 'Welcome to Urban Studioz 👋 Select from the options below',
    buttons: [
      { id: 'b1', label: 'Shop Now', targetNodeId: 'node-msg' },
      { id: 'b2', label: 'Track Order', targetNodeId: 'node-msg' },
      { id: 'b3', label: 'Talk to an Agent', targetNodeId: 'node-intervention' },
    ],
    x: 340,
    y: 60,
  },
  {
    id: 'node-msg',
    type: 'message',
    title: 'Message',
    imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80',
    content: 'This Message will show the live order status & tracking details.',
    buttons: [
      { id: 'b4', label: 'Talk to an Agent', targetNodeId: 'node-intervention' },
    ],
    x: 680,
    y: 60,
  },
  {
    id: 'node-intervention',
    type: 'requestIntervention',
    title: 'Request Intervention',
    content: 'Our Team will be in touch with you soon!',
    buttons: [],
    x: 680,
    y: 380,
  },
];

export default function ChatflowBuilder({
  initialFlows,
  botName,
  primaryColor = '#25D366',
  onSave,
  saving = false,
}: ChatflowBuilderProps) {
  const [flows, setFlows] = useState<FlowNode[]>(() =>
    initialFlows && initialFlows.length > 0 ? initialFlows : DEFAULT_FLOWS
  );
  const [flowTitle, setFlowTitle] = useState('No-Code Chatbot Flow');
  const [flowActive, setFlowActive] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newTrigger, setNewTrigger] = useState<{ [nodeId: string]: string }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Dynamic WhatsApp Profile or Random Name with Blue Tick
  const [waProfile, setWaProfile] = useState<{
    isScanned: boolean;
    name: string;
    avatarUrl?: string | null;
    phone?: string;
  }>({
    isScanned: false,
    name: 'Urban Studioz',
  });

  useEffect(() => {
    whatsappApi.getStatus().then(res => {
      const waData = res?.data;
      if (waData && waData.status === 'connected' && (waData.pushName || waData.phone)) {
        setWaProfile({
          isScanned: true,
          name: waData.pushName || (waData.phone ? `+${waData.phone}` : botName || 'WhatsApp Business'),
          avatarUrl: waData.profilePicUrl || null,
          phone: waData.phone,
        });
      } else {
        const randomName = RANDOM_PREVIEW_NAMES[Math.floor(Math.random() * RANDOM_PREVIEW_NAMES.length)];
        setWaProfile({
          isScanned: false,
          name: randomName,
        });
      }
    }).catch(() => {
      const randomName = RANDOM_PREVIEW_NAMES[Math.floor(Math.random() * RANDOM_PREVIEW_NAMES.length)];
      setWaProfile({
        isScanned: false,
        name: randomName,
      });
    });
  }, [botName]);

  // Drag state for board nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  // Phone Simulator state
  const [simMessages, setSimMessages] = useState<Array<{
    id: string;
    sender: 'bot' | 'user';
    text: string;
    imageUrl?: string;
    buttons?: FlowNodeButton[];
    time: string;
  }>>([]);
  const [simTyping, setSimTyping] = useState(false);
  const [simInput, setSimInput] = useState('');
  const phoneEndRef = useRef<HTMLDivElement>(null);

  const now = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Initialize phone simulation on mount or reset
  const resetSimulation = () => {
    const startNode = flows.find(n => n.type === 'flowStart') || flows[0];
    const firstConnectedNode = flows.find(n => n.id === 'node-media') || flows[1] || startNode;

    setSimMessages([
      {
        id: 'msg-user-1',
        sender: 'user',
        text: 'Help',
        time: now(),
      },
      {
        id: 'msg-bot-1',
        sender: 'bot',
        text: firstConnectedNode.content || 'Welcome! How can we help you?',
        imageUrl: firstConnectedNode.imageUrl,
        buttons: firstConnectedNode.buttons,
        time: now(),
      },
    ]);
  };

  useEffect(() => {
    resetSimulation();
  }, []);

  useEffect(() => {
    phoneEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, simTyping]);

  // Handle clicking button in phone simulator to branch flow
  const handlePhoneButtonClick = (btn: FlowNodeButton) => {
    // 1. Add user reply bubble
    setSimMessages(prev => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        sender: 'user',
        text: btn.label,
        time: now(),
      },
    ]);

    setSimTyping(true);

    setTimeout(() => {
      setSimTyping(false);

      const target = flows.find(n => n.id === btn.targetNodeId);
      if (target) {
        setSimMessages(prev => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: target.content || 'Here is what you requested.',
            imageUrl: target.imageUrl,
            buttons: target.buttons,
            time: now(),
          },
        ]);
      } else {
        setSimMessages(prev => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: `You selected "${btn.label}". Our agent will connect with you shortly!`,
            time: now(),
          },
        ]);
      }
    }, 600);
  };

  const handlePhoneSend = () => {
    if (!simInput.trim()) return;
    const text = simInput.trim();
    setSimInput('');

    setSimMessages(prev => [
      ...prev,
      { id: 'user-' + Date.now(), sender: 'user', text, time: now() },
    ]);

    setSimTyping(true);

    setTimeout(() => {
      setSimTyping(false);
      // Check if matches start trigger
      const startNode = flows.find(n => n.type === 'flowStart');
      const triggers = startNode?.triggers?.map(t => t.toLowerCase()) || ['hi', 'hello', 'help'];
      const matched = triggers.some(t => text.toLowerCase().includes(t));

      const mediaNode = flows.find(n => n.type === 'mediaButtons') || flows[1] || flows[0];

      if (matched && mediaNode) {
        setSimMessages(prev => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: mediaNode.content,
            imageUrl: mediaNode.imageUrl,
            buttons: mediaNode.buttons,
            time: now(),
          },
        ]);
      } else {
        setSimMessages(prev => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: `Thanks for your message: "${text}". Type "Help" or "Hi" to restart the flow!`,
            time: now(),
          },
        ]);
      }
    }, 600);
  };

  // Node Drag & Drop Handlers
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    const node = flows.find(n => n.id === nodeId);
    if (!node || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - boardRect.left) / zoom - node.x,
      y: (e.clientY - boardRect.top) / zoom - node.y,
    });
  };

  const handleMouseMoveBoard = (e: React.MouseEvent) => {
    if (!draggingNodeId || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.round((e.clientX - boardRect.left) / zoom - dragOffset.x));
    const newY = Math.max(10, Math.round((e.clientY - boardRect.top) / zoom - dragOffset.y));

    setFlows(prev =>
      prev.map(n => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUpBoard = () => {
    setDraggingNodeId(null);
  };

  // Node CRUD
  const handleAddNode = (type: FlowNode['type']) => {
    const id = 'node-' + Date.now();
    const titles: Record<FlowNode['type'], string> = {
      flowStart: 'Flow Start',
      mediaButtons: 'Media + Buttons',
      message: 'Message',
      requestIntervention: 'Request Intervention',
    };

    const newNode: FlowNode = {
      id,
      type,
      title: titles[type],
      content: type === 'requestIntervention'
        ? 'Our team will assist you shortly.'
        : 'Enter message text here...',
      imageUrl: type === 'mediaButtons' ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' : undefined,
      triggers: type === 'flowStart' ? ['Start', 'Hello'] : undefined,
      buttons: type === 'mediaButtons' || type === 'message'
        ? [{ id: 'b-' + Date.now(), label: 'Quick Reply' }]
        : [],
      x: 100 + (flows.length % 3) * 200,
      y: 120 + (flows.length % 2) * 150,
    };

    setFlows([...flows, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteNode = (id: string) => {
    setFlows(flows.filter(n => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleAddTrigger = (nodeId: string) => {
    const val = newTrigger[nodeId]?.trim();
    if (!val) return;
    setFlows(prev =>
      prev.map(n => {
        if (n.id !== nodeId) return n;
        const curr = n.triggers || [];
        if (curr.includes(val)) return n;
        return { ...n, triggers: [...curr, val] };
      })
    );
    setNewTrigger(prev => ({ ...prev, [nodeId]: '' }));
  };

  const handleRemoveTrigger = (nodeId: string, trg: string) => {
    setFlows(prev =>
      prev.map(n => (n.id === nodeId ? { ...n, triggers: n.triggers?.filter(t => t !== trg) } : n))
    );
  };

  const handleAddButton = (nodeId: string) => {
    const btnId = 'b-' + Date.now();
    setFlows(prev =>
      prev.map(n => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          buttons: [...(n.buttons || []), { id: btnId, label: 'New Button' }],
        };
      })
    );
  };

  const handleUpdateButton = (nodeId: string, btnId: string, field: 'label' | 'targetNodeId', val: string) => {
    setFlows(prev =>
      prev.map(n => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          buttons: n.buttons?.map(b => (b.id === btnId ? { ...b, [field]: val } : b)),
        };
      })
    );
  };

  const handleRemoveButton = (nodeId: string, btnId: string) => {
    setFlows(prev =>
      prev.map(n => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          buttons: n.buttons?.filter(b => b.id !== btnId),
        };
      })
    );
  };

  const handleSaveAll = async () => {
    try {
      await onSave(flows);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      alert('Failed to save flow.');
    }
  };

  // Helper to draw SVG connector curves
  const renderConnectorLines = () => {
    const lines: React.ReactNode[] = [];

    // Line from Flow Start to next node (default media node)
    const startNode = flows.find(n => n.type === 'flowStart');
    const mediaNode = flows.find(n => n.type === 'mediaButtons') || flows[1];

    if (startNode && mediaNode && startNode.id !== mediaNode.id) {
      const x1 = startNode.x + 220;
      const y1 = startNode.y + 70;
      const x2 = mediaNode.x;
      const y2 = mediaNode.y + 70;
      const cx1 = x1 + Math.abs(x2 - x1) * 0.5;
      const cx2 = x2 - Math.abs(x2 - x1) * 0.5;

      lines.push(
        <path
          key={`conn-start-${startNode.id}-${mediaNode.id}`}
          d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
          stroke="#10b981"
          strokeWidth="2.5"
          strokeDasharray="5,5"
          fill="none"
        />
      );
    }

    // Lines from buttons to their target nodes
    flows.forEach(src => {
      src.buttons?.forEach((btn, bIdx) => {
        if (!btn.targetNodeId) return;
        const target = flows.find(n => n.id === btn.targetNodeId);
        if (!target) return;

        const x1 = src.x + 260;
        const y1 = src.y + 160 + bIdx * 38;
        const x2 = target.x;
        const y2 = target.y + 60;
        const cx1 = x1 + Math.max(60, Math.abs(x2 - x1) * 0.5);
        const cx2 = x2 - Math.max(60, Math.abs(x2 - x1) * 0.5);

        lines.push(
          <path
            key={`conn-${src.id}-${btn.id}-${target.id}`}
            d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
            stroke={src.type === 'mediaButtons' ? '#10b981' : '#3b82f6'}
            strokeWidth="2.5"
            strokeDasharray="4,4"
            fill="none"
          />
        );
      });
    });

    return lines;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Top Header Bar ── */}
      <div className="card" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
      }}>
        {/* Left: Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={flowTitle}
                onChange={e => setFlowTitle(e.target.value)}
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0f172a',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  maxWidth: 240,
                }}
              />
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                Active Flow
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Drag nodes & configure button replies. Test interactively in live phone simulator.
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Add Node Dropdown */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={() => handleAddNode('mediaButtons')}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <Plus size={13} /> Media+Buttons
            </button>
            <button
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={() => handleAddNode('message')}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <Plus size={13} /> Message
            </button>
            <button
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={() => handleAddNode('requestIntervention')}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <Plus size={13} /> Handover
            </button>
          </div>

          <button
            className="btn btn-primary btn-sm flex items-center gap-2"
            onClick={handleSaveAll}
            disabled={saving}
            style={{ minWidth: 120, padding: '8px 18px', fontWeight: 600 }}
          >
            {savedSuccess ? <><CheckCheck size={14} /> Saved!</> : saving ? <><RefreshCw size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* ── Main Workspace: Canvas Board (Left) + Phone Simulator (Right) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 360px',
        gap: 16,
        alignItems: 'start',
      }}>

        {/* ── Interactive Canvas Board ── */}
        <div
          ref={boardRef}
          onMouseMove={handleMouseMoveBoard}
          onMouseUp={handleMouseUpBoard}
          style={{
            minHeight: 640,
            height: 640,
            background: '#f8fafc',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'auto',
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            userSelect: 'none',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          {/* Zoom controls floating */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 30,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}>
            <button
              onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 600, minWidth: 36, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.4, zoom + 0.1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(1)}
              style={{ fontSize: 10, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}
            >
              Reset
            </button>
          </div>

          {/* SVG Connector Lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 2000,
              height: 2000,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {renderConnectorLines()}
          </svg>

          {/* Render Flow Nodes */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
          }}>
            {flows.map(node => {
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onMouseDown={e => handleMouseDownNode(e, node.id)}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: node.type === 'flowStart' ? 220 : 270,
                    background: '#ffffff',
                    borderRadius: 16,
                    border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                    boxShadow: isSelected
                      ? '0 12px 30px rgba(16, 185, 129, 0.15), 0 4px 10px rgba(0,0,0,0.05)'
                      : '0 6px 20px rgba(0, 0, 0, 0.04)',
                    cursor: draggingNodeId === node.id ? 'grabbing' : 'grab',
                    zIndex: isSelected ? 20 : 10,
                    transition: draggingNodeId === node.id ? 'none' : 'box-shadow 0.2s',
                  }}
                >
                  {/* Node Header */}
                  <div style={{
                    padding: '10px 14px',
                    borderTopLeftRadius: 14,
                    borderTopRightRadius: 14,
                    background: node.type === 'flowStart'
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : node.type === 'mediaButtons'
                      ? 'linear-gradient(135deg, #0d9488, #14b8a6)'
                      : node.type === 'message'
                      ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                      : 'linear-gradient(135deg, #4f46e5, #818cf8)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {node.type === 'flowStart' ? (
                        <Play size={13} fill="white" />
                      ) : node.type === 'mediaButtons' ? (
                        <FileImage size={14} />
                      ) : node.type === 'message' ? (
                        <MessageSquare size={14} />
                      ) : (
                        <UserCheck size={14} />
                      )}
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{node.title}</span>
                    </div>

                    {node.type !== 'flowStart' && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: 'white',
                          borderRadius: 6,
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  {/* Node Body */}
                  <div style={{ padding: 14 }}>
                    {/* Media Preview if exists */}
                    {node.imageUrl && (
                      <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', height: 90, background: '#f1f5f9' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={node.imageUrl}
                          alt="Node media"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Subtitle tag */}
                    {node.subtitle && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {node.subtitle}
                      </div>
                    )}

                    {/* Content text */}
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, marginBottom: 12 }}>
                      {node.content}
                    </p>

                    {/* Flow Start Keywords */}
                    {node.type === 'flowStart' && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                          Trigger Keywords
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                          {node.triggers?.map(trg => (
                            <span
                              key={trg}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: '#f1f5f9',
                                color: '#1e293b',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {trg}
                              <X
                                size={11}
                                style={{ cursor: 'pointer', color: '#94a3b8' }}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleRemoveTrigger(node.id, trg);
                                }}
                              />
                            </span>
                          ))}
                        </div>

                        {/* Add trigger input */}
                        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="Add trigger..."
                            value={newTrigger[node.id] || ''}
                            onChange={e => setNewTrigger({ ...newTrigger, [node.id]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleAddTrigger(node.id)}
                            style={{
                              flex: 1,
                              fontSize: 11,
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => handleAddTrigger(node.id)}
                            style={{
                              background: '#059669',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Buttons */}
                    {node.buttons && node.buttons.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
                          Buttons &amp; Branching
                        </div>
                        {node.buttons.map(btn => (
                          <div
                            key={btn.id}
                            onClick={e => e.stopPropagation()}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              padding: '6px 8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                              <input
                                type="text"
                                value={btn.label}
                                onChange={e => handleUpdateButton(node.id, btn.id, 'label', e.target.value)}
                                style={{
                                  flex: 1,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  border: 'none',
                                  background: 'transparent',
                                  outline: 'none',
                                }}
                              />
                              <X
                                size={12}
                                style={{ cursor: 'pointer', color: '#94a3b8' }}
                                onClick={() => handleRemoveButton(node.id, btn.id)}
                              />
                            </div>

                            {/* Target Node selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
                              <span>→ Next:</span>
                              <select
                                value={btn.targetNodeId || ''}
                                onChange={e => handleUpdateButton(node.id, btn.id, 'targetNodeId', e.target.value)}
                                style={{
                                  flex: 1,
                                  fontSize: 10,
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                  border: '1px solid #cbd5e1',
                                  background: 'white',
                                  outline: 'none',
                                }}
                              >
                                <option value="">(None / End)</option>
                                {flows
                                  .filter(n => n.id !== node.id)
                                  .map(t => (
                                    <option key={t.id} value={t.id}>
                                      {t.title} ({t.id.slice(-4)})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add button option for media/message nodes */}
                    {(node.type === 'mediaButtons' || node.type === 'message') && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleAddButton(node.id);
                        }}
                        style={{
                          marginTop: 8,
                          width: '100%',
                          padding: '6px',
                          borderRadius: 8,
                          background: '#f1f5f9',
                          border: '1px dashed #cbd5e1',
                          color: '#475569',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        <Plus size={12} /> Add Reply Button
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── High-Fidelity WhatsApp Phone Simulator (Right) ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          border: '1px solid #e2e8f0',
          padding: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          height: 640,
        }}>
          {/* Simulator Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Smartphone size={16} style={{ color: primaryColor }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Live Phone Tester</span>
            </div>
            <button
              onClick={resetSimulation}
              className="btn btn-secondary btn-sm flex items-center gap-1"
              style={{ fontSize: 11, padding: '4px 8px' }}
              title="Restart Test Conversation"
            >
              <RefreshCw size={11} /> Reset
            </button>
          </div>

          {/* Realistic WhatsApp Phone Shell */}
          <div style={{
            flex: 1,
            borderRadius: 20,
            overflow: 'hidden',
            border: '2px solid #0f172a',
            display: 'flex',
            flexDirection: 'column',
            background: '#e5ddd5',
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
            backgroundSize: '300px',
            position: 'relative',
          }}>
            {/* WhatsApp Top Bar */}
            <div style={{
              background: '#075e54',
              color: 'white',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {waProfile.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={waProfile.avatarUrl}
                    alt={waProfile.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: waProfile.isScanned ? '#25d366' : '#0284c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, color: 'white',
                  }}>
                    {waProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{waProfile.name}</span>
                    {/* Blue Verified Tick Badge for random name, or green for verified scanned account */}
                    <span
                      title={waProfile.isScanned ? 'Connected WhatsApp Account' : 'Verified Business Profile'}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        background: waProfile.isScanned ? '#25d366' : '#1d9bf0', // Blue tick if not scanned, green if scanned
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        color: '#ffffff',
                        fontWeight: 900,
                        boxShadow: waProfile.isScanned ? 'none' : '0 1px 3px rgba(29,155,240,0.4)',
                      }}
                    >
                      ✓
                    </span>
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.85 }}>
                    {waProfile.isScanned
                      ? (waProfile.phone ? `+${waProfile.phone} • Online` : 'Connected WhatsApp • Online')
                      : 'Business Account • Online'}
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Messages Scroll Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {simMessages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Bubble Container */}
                  <div style={{
                    background: msg.sender === 'user' ? '#dcf8c6' : '#ffffff',
                    borderRadius: 12,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                  }}>
                    {/* Attached Image if any */}
                    {msg.imageUrl && (
                      <div style={{ width: '100%', height: 110, background: '#f1f5f9' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imageUrl}
                          alt="Product"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Text Body */}
                    <div style={{ padding: '8px 10px', fontSize: 12, color: '#111827', lineHeight: 1.4 }}>
                      {msg.text}
                      <div style={{ textAlign: 'right', fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                        {msg.time} {msg.sender === 'user' && '✓✓'}
                      </div>
                    </div>

                    {/* Native WhatsApp Interactive Buttons */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        {msg.buttons.map(btn => (
                          <button
                            key={btn.id}
                            onClick={() => handlePhoneButtonClick(btn)}
                            style={{
                              width: '100%',
                              padding: '9px 10px',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid #e2e8f0',
                              color: '#0284c7',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#e0f2fe')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {simTyping && (
                <div style={{
                  alignSelf: 'flex-start',
                  background: 'white',
                  borderRadius: 12,
                  padding: '6px 12px',
                  fontSize: 11,
                  color: '#6b7280',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}>
                  {waProfile.name} is typing...
                </div>
              )}

              <div ref={phoneEndRef} />
            </div>

            {/* WhatsApp Phone Bottom Input */}
            <div style={{
              background: '#f0f0f0',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <input
                type="text"
                placeholder="Type a message (e.g. Help)..."
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePhoneSend()}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 18,
                  border: 'none',
                  background: 'white',
                  padding: '0 12px',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                onClick={handlePhoneSend}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#075e54',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
