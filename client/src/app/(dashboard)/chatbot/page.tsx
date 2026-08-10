'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import { chatbotApi, knowledgeApi } from '@/lib/api';
import {
  Bot, Plus, Trash2, Save, Copy, CheckCheck, ToggleLeft, ToggleRight,
  Zap, MessageSquare, Code2, Settings, Globe, Eye, Send, Palette,
  Shield, X, ChevronRight, Monitor, Sparkles, User, Check, BookOpen,
  Search, Edit2, Brain, Tag, Star, AlertCircle, RefreshCw, ChevronDown
} from 'lucide-react';

interface ChatbotRule {
  _id?: string;
  keyword: string;
  response: string;
  matchType: 'exact' | 'contains' | 'startsWith';
}

type Tab = 'settings' | 'appearance' | 'rules' | 'preview' | 'embed' | 'knowledge';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'settings', label: 'Bot Identity & Settings', icon: Settings },
  { key: 'appearance', label: 'Appearance & Themes', icon: Palette },
  { key: 'rules', label: 'Auto-Reply Rules', icon: Zap },
  { key: 'knowledge', label: 'Company Knowledge', icon: BookOpen },
  { key: 'preview', label: 'Test Simulator', icon: Eye },
  { key: 'embed', label: 'Embed Widget', icon: Code2 },
];

const KNOWLEDGE_CATEGORIES = [
  'Company', 'Products', 'Services', 'Pricing', 'Commission', 'Subscription',
  'Restaurant', 'Customer', 'Delivery', 'Orders', 'Payments', 'Refunds',
  'Policies', 'Locations', 'Features', 'Support', 'FAQ', 'Other',
];

const PRESET_COLORS = [
  { label: 'WhatsApp Green', primary: '#25D366', secondary: '#128C7E' },
  { label: 'Royal Indigo', primary: '#6366F1', secondary: '#4F46E5' },
  { label: 'Sunset Purple', primary: '#8B5CF6', secondary: '#D946EF' },
  { label: 'Neon Emerald', primary: '#10B981', secondary: '#059669' },
  { label: 'Vibrant Ruby', primary: '#F43F5E', secondary: '#BE123C' },
  { label: 'Classic Slate', primary: '#475569', secondary: '#1E293B' },
];

const ICON_OPTIONS = [
  { key: 'bot', icon: Bot, label: 'Default Bot' },
  { key: 'sparkles', icon: Sparkles, label: 'AI Magic' },
  { key: 'message', icon: MessageSquare, label: 'Chat Balloon' },
  { key: 'user', icon: User, label: 'Human Assistant' },
  { key: 'zap', icon: Zap, label: 'Instant Agent' },
  { key: 'globe', icon: Globe, label: 'Global Help' },
];

const RULE_TEMPLATES = [
  { keyword: 'hello', response: 'Hello! 👋 How can we help you today? Ask a question or share your contact details to connect.' },
  { keyword: 'talk', response: 'We would love to speak with you! Please share your phone number or email and our representative will contact you shortly.' },
  { keyword: 'price', response: 'Our pricing plans start from just $19/month. You can find our full pricing structure here: https://example.com/pricing' },
  { keyword: 'hours', response: 'Our support team is active Monday to Friday from 9 AM to 6 PM EST. Feel free to leave a message and we will respond as soon as we are online!' },
  { keyword: 'contact', response: 'You can reach our helpdesk via email at support@example.com or call us directly at +1-800-555-0199.' },
  { keyword: 'discount', response: 'Use coupon code BLASTUP10 at checkout to get an extra 10% off on your first month!' },
];

export default function ChatbotPage() {
  // General settings
  const [enabled, setEnabled] = useState(false);
  const [botName, setBotName] = useState('Blastup Bot');
  const [botIcon, setBotIcon] = useState('bot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! Welcome. How can I help you today? 👋');
  const [fallbackMessage, setFallbackMessage] = useState("Thanks for reaching out! 🚀 Share your details or ask a question and our team will connect with you right away.");
  const [offlineMessage, setOfflineMessage] = useState("We're currently offline. Please leave a message and we'll get back to you.");
  const [headerText, setHeaderText] = useState('Chat with us');
  const [subHeaderText, setSubHeaderText] = useState('We typically reply within minutes');
  const [buttonLabel, setButtonLabel] = useState('Chat');
  const [collectLeads, setCollectLeads] = useState(false);
  const [leadFields, setLeadFields] = useState<Array<'name' | 'email' | 'phone'>>(['name', 'email']);

  // Appearance
  const [primaryColor, setPrimaryColor] = useState('#25D366');
  const [secondaryColor, setSecondaryColor] = useState('#128C7E');
  const [gradient, setGradient] = useState(true);
  const [gradientAngle, setGradientAngle] = useState(135);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [theme, setTheme] = useState<'classic' | 'glassmorphic'>('glassmorphic');

  // Chatbot ID
  const [chatbotId, setChatbotId] = useState<string>('');

  // Rules
  const [rules, setRules] = useState<ChatbotRule[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [copied, setCopied] = useState(false);
  const [widgetCode, setWidgetCode] = useState('');

  // Floating Simulator state
  const [floatingOpen, setFloatingOpen] = useState(true);
  const [simulatedLeadDone, setSimulatedLeadDone] = useState(false);
  const [simulatedName, setSimulatedName] = useState('');
  const [simulatedEmail, setSimulatedEmail] = useState('');
  const [simulatedPhone, setSimulatedPhone] = useState('');

  // Preview messages
  const [previewMessages, setPreviewMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewTyping, setPreviewTyping] = useState(false);
  const previewEndRef = useRef<HTMLDivElement>(null);

  // ── Company Knowledge state ──────────────────────────────────────
  interface KnowledgeItem {
    _id: string; title: string; category: string; content: string;
    keywords: string[]; synonyms: string[]; priority: number;
    status: 'active' | 'inactive'; createdAt: string;
  }
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState('');
  const [knowledgeStatusFilter, setKnowledgeStatusFilter] = useState('');
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [kForm, setKForm] = useState({
    title: '', category: 'Other', content: '',
    keywords: '', synonyms: '', priority: 5, status: 'active' as 'active' | 'inactive',
  });
  const [kSaving, setKSaving] = useState(false);
  // Test chat panel
  const [testQuery, setTestQuery] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testMessages, setTestMessages] = useState<Array<{
    role: 'user' | 'bot';
    text: string;
    meta?: { intent: string; confidence: number; knowledgeTitle: string | null; suggestions: string[] };
  }>>([]);
  const testEndRef = useRef<HTMLDivElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001');

  useEffect(() => {
    fetch(`${backendUrl}/widget.js`)
      .then((res) => {
        if (!res.ok) throw new Error('Status: ' + res.status);
        return res.text();
      })
      .then((code) => {
        setWidgetCode(code);
      })
      .catch((err) => {
        console.error('Failed to load widget code:', err);
      });
  }, [backendUrl]);

  useEffect(() => {
    chatbotApi.get().then((res) => {
      const d = res.data;
      if (d) {
        setEnabled(d.enabled || false);
        setBotName(d.botName || 'Blastup Bot');
        setBotIcon(d.botIcon || 'bot');
        setWelcomeMessage(d.welcomeMessage || 'Hello! Welcome. How can I help you today? 👋');
        setFallbackMessage(d.fallbackMessage || "Thanks for reaching out! 🚀 Share your details or ask a question and our team will connect with you right away.");
        setOfflineMessage(d.offlineMessage || "We're currently offline.");
        setHeaderText(d.headerText || 'Chat with us');
        setSubHeaderText(d.subHeaderText || 'We typically reply within minutes');
        setButtonLabel(d.buttonLabel || 'Chat');
        setPrimaryColor(d.primaryColor || '#25D366');
        setSecondaryColor(d.secondaryColor || '#128C7E');
        setGradient(d.gradient !== undefined ? d.gradient : true);
        setGradientAngle(d.gradientAngle !== undefined ? d.gradientAngle : 135);
        setPosition(d.position || 'bottom-right');
        setTheme(d.theme || 'glassmorphic');
        setChatbotId(d._id || '');
        setRules(d.rules || []);
        setCollectLeads(d.collectLeads || false);
        setLeadFields(d.leadFields || ['name', 'email']);
      }
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'preview') {
      setPreviewMessages([{ sender: 'bot', text: welcomeMessage, time: now() }]);
    }
  }, [activeTab, welcomeMessage]);

  useEffect(() => {
    previewEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [previewMessages, previewTyping, floatingOpen, simulatedLeadDone]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSave = async () => {
    setSaving(true);
    try {
      await chatbotApi.update({
        enabled, botName, botIcon, welcomeMessage, fallbackMessage, offlineMessage,
        headerText, subHeaderText, buttonLabel,
        primaryColor, secondaryColor, gradient, gradientAngle, position, theme,
        rules, collectLeads, leadFields,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Rules
  const handleAddRule = () => setRules([...rules, { keyword: '', response: '', matchType: 'contains' }]);
  const handleRemoveRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
  const handleRuleChange = (i: number, field: keyof ChatbotRule, value: string) => {
    const u = [...rules]; (u[i] as any)[field] = value; setRules(u);
  };
  const handleApplyTemplate = (tpl: typeof RULE_TEMPLATES[0]) => {
    if (rules.some(r => r.keyword.toLowerCase() === tpl.keyword)) return;
    setRules([...rules, { keyword: tpl.keyword, response: tpl.response, matchType: 'contains' }]);
  };

  // Lead fields toggle
  const toggleLeadField = (f: 'name' | 'email' | 'phone') => {
    setLeadFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  // Preview simulate
  const sendPreviewMessage = () => {
    if (!previewInput.trim()) return;
    const userMsg = previewInput.trim();
    setPreviewMessages(p => [...p, { sender: 'user', text: userMsg, time: now() }]);
    setPreviewInput('');
    setPreviewTyping(true);
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      const isGreeting = /^(hey|hi|hello|hola|hey there|good morning|good afternoon|good evening|yo|hlo)\b/i.test(lower);
      let reply = fallbackMessage;
      let matchedRule = false;
      for (const rule of rules) {
        if (!rule.keyword) continue;
        const kw = rule.keyword.toLowerCase();
        if ((rule.matchType === 'exact' && lower === kw) ||
          (rule.matchType === 'startsWith' && lower.startsWith(kw)) ||
          (rule.matchType === 'contains' && lower.includes(kw))) {
          reply = rule.response; matchedRule = true; break;
        }
      }
      if (!matchedRule && isGreeting) {
        reply = "Hello! 👋 Thanks for reaching out. How can we help you today? Feel free to ask any question or leave your contact details so our team can connect with you!";
      }
      setPreviewMessages(p => [...p, { sender: 'bot', text: reply, time: now() }]);
      setPreviewTyping(false);
    }, 800);
  };

  // ── Knowledge Handlers ───────────────────────────────────────────

  const loadKnowledge = async () => {
    setKnowledgeLoading(true);
    try {
      const params: Record<string, string> = {};
      if (knowledgeSearch) params.search = knowledgeSearch;
      if (knowledgeCategoryFilter) params.category = knowledgeCategoryFilter;
      if (knowledgeStatusFilter) params.status = knowledgeStatusFilter;
      const res = await knowledgeApi.list(params);
      setKnowledgeItems(res.data || []);
    } catch { /* silent */ } finally {
      setKnowledgeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'knowledge') loadKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, knowledgeSearch, knowledgeCategoryFilter, knowledgeStatusFilter]);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  const openAddModal = () => {
    setEditingItem(null);
    setKForm({ title: '', category: 'Other', content: '', keywords: '', synonyms: '', priority: 5, status: 'active' });
    setShowKnowledgeModal(true);
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setKForm({
      title: item.title,
      category: item.category,
      content: item.content,
      keywords: item.keywords.join(', '),
      synonyms: item.synonyms.join(', '),
      priority: item.priority,
      status: item.status,
    });
    setShowKnowledgeModal(true);
  };

  const handleSaveKnowledge = async () => {
    if (!kForm.title.trim() || !kForm.content.trim()) return;
    setKSaving(true);
    try {
      const payload = {
        title: kForm.title.trim(),
        category: kForm.category,
        content: kForm.content.trim(),
        keywords: kForm.keywords.split(',').map(k => k.trim()).filter(Boolean),
        synonyms: kForm.synonyms.split(',').map(s => s.trim()).filter(Boolean),
        priority: kForm.priority,
        status: kForm.status,
      };
      if (editingItem) {
        await knowledgeApi.update(editingItem._id, payload);
      } else {
        await knowledgeApi.create(payload);
      }
      setShowKnowledgeModal(false);
      loadKnowledge();
    } catch { alert('Failed to save knowledge. Please try again.'); } finally {
      setKSaving(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Delete this knowledge item? This cannot be undone.')) return;
    try {
      await knowledgeApi.delete(id);
      loadKnowledge();
    } catch { alert('Failed to delete. Please try again.'); }
  };

  const handleToggleKnowledgeStatus = async (item: KnowledgeItem) => {
    try {
      await knowledgeApi.update(item._id, { status: item.status === 'active' ? 'inactive' : 'active' });
      loadKnowledge();
    } catch { /* silent */ }
  };

  const sendTestMessage = async () => {
    if (!testQuery.trim() || testLoading) return;
    const msg = testQuery.trim();
    setTestQuery('');
    setTestMessages(p => [...p, { role: 'user', text: msg }]);
    setTestLoading(true);
    try {
      const res = await knowledgeApi.test(msg, 'admin_test_session');
      const d = res.data;
      setTestMessages(p => [...p, {
        role: 'bot', text: d.reply,
        meta: { intent: d.intent, confidence: d.confidence, knowledgeTitle: d.knowledgeTitle, suggestions: d.suggestions },
      }]);
    } catch {
      setTestMessages(p => [...p, { role: 'bot', text: 'Error running test. Please try again.' }]);
    } finally {
      setTestLoading(false);
    }
  };


  const sOpen = '\x3Cscript\x3E';
  const sClose = '\x3C/script\x3E';
  const embedCode = [
    '\x3C!-- Blastup WhatsApp Chatbot Widget --\x3E',
    sOpen,
    '  window.BlastupConfig = {',
    `    apiUrl: '${backendUrl}',`,
    `    position: '${position}',`,
    `    primaryColor: '${primaryColor}',`,
    `    secondaryColor: '${secondaryColor}',`,
    `    gradient: ${gradient},`,
    `    gradientAngle: ${gradientAngle},`,
    `    botName: '${botName.replace(/'/g, "\\'")}',`,
    `    botIcon: '${botIcon}',`,
    `    headerText: '${headerText.replace(/'/g, "\\'")}',`,
    `    subHeaderText: '${subHeaderText.replace(/'/g, "\\'")}',`,
    `    buttonLabel: '${buttonLabel.replace(/'/g, "\\'")}',`,
    `    collectLeads: ${collectLeads},`,
    `    leadFields: ${JSON.stringify(leadFields)},`,
    `    theme: '${theme}',`,
    `    chatbotId: '${chatbotId}',`,
    '  };',
    '',
    widgetCode || '// Loading widget script...',
    sClose,
  ].join('\n');

  const handleCopy = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Calculate step completions for onboarding
  const steps = [
    { n: 1, label: 'Identity', desc: 'Set name & welcome prompt', tab: 'settings' as Tab, isComplete: botName.trim().length > 0 && welcomeMessage.trim().length > 0 },
    { n: 2, label: 'Appearance', desc: 'Set branding & style', tab: 'appearance' as Tab, isComplete: !!primaryColor },
    { n: 3, label: 'Auto-Reply Rules', desc: 'Add response keywords', tab: 'rules' as Tab, isComplete: rules.length > 0 },
    { n: 4, label: 'Copy & Embed', desc: 'Integrate into website', tab: 'embed' as Tab, isComplete: copied },
  ];
  const completedCount = steps.filter(s => s.isComplete).length;
  const completionPercentage = Math.round((completedCount / steps.length) * 100);

  // Render Bot Icon dynamically
  const renderBotIcon = (size: number, color?: string) => {
    const isUrl = botIcon.startsWith('http://') || botIcon.startsWith('https://') || botIcon.startsWith('/') || botIcon.includes('.');
    if (isUrl) {
      return (
        <img
          src={botIcon}
          alt="Bot Avatar"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            // fallback if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    const selected = ICON_OPTIONS.find(o => o.key === botIcon) || ICON_OPTIONS[0];
    const IconComponent = selected.icon;
    return <IconComponent size={size} style={{ color: color || 'white' }} />;
  };

  const headerGradientStyle = gradient
    ? 'linear-gradient(' + gradientAngle + 'deg, ' + primaryColor + ', ' + secondaryColor + ')'
    : primaryColor;

  if (loading) {
    return (
      <div>
        <Header title="Chatbot" subtitle="AI-powered auto-response engine" />
        <div className="page-content">
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Bot size={28} color="white" />
            </div>
            <p className="text-secondary">Loading chatbot configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Chatbot" subtitle="Premium keyword-triggered auto-response engine for WhatsApp" />
      <div className="page-content" style={{ maxWidth: 1100 }}>

        {/* ── Premium Setup Onboarding Wizard ── */}
        <div className="card" style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(37, 211, 102, 0.03) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          padding: '24px 28px',
          borderRadius: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <Sparkles size={16} className="text-accent" />
                <span className="font-bold" style={{ fontSize: 16, color: 'var(--color-text)' }}>Chatbot Setup Progress</span>
              </div>
              <span className="text-xs text-secondary">
                Follow these interactive steps to configure and launch your website chatbot.
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>{completionPercentage}% Complete</span>
              <span className="text-xs text-secondary" style={{ display: 'block' }}>{completedCount} of 5 tasks finished</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: 6, background: 'var(--color-border)', borderRadius: 10, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ width: completionPercentage + '%', height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', borderRadius: 10, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>

          {/* Stepper Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            {steps.map(step => {
              const isCurrent = activeTab === step.tab;
              const cardBg = isCurrent ? '#ffffff' : (step.isComplete ? 'rgba(37, 211, 102, 0.04)' : 'rgba(255, 255, 255, 0.4)');
              const cardBorder = isCurrent ? '1.5px solid var(--color-accent)' : (step.isComplete ? '1px solid rgba(37, 211, 102, 0.2)' : '1px solid var(--color-border)');
              return (
                <div
                  key={step.n}
                  onClick={() => setActiveTab(step.tab)}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: 12,
                    padding: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isCurrent ? 'var(--shadow-md)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 100,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span className="font-mono text-xs font-bold text-secondary">0{step.n}</span>
                    {step.isComplete ? (
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    ) : (
                      <span style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--color-text-tertiary)', display: 'inline-block' }} />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-xs" style={{ color: 'var(--color-text)', marginBottom: 2 }}>{step.label}</div>
                    <div className="text-secondary" style={{ fontSize: 10, lineHeight: 1.2 }}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Hero Status Banner ── */}
        <div className="card" style={{
          marginBottom: 24,
          background: enabled ? 'linear-gradient(135deg, rgba(37,211,102,0.12) 0%, rgba(18,140,126,0.08) 100%)' : 'var(--color-bg-secondary)',
          border: enabled ? '1px solid rgba(37,211,102,0.3)' : '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: enabled ? headerGradientStyle : 'var(--color-bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: enabled ? '0 4px 24px ' + primaryColor + '55' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {renderBotIcon(26, enabled ? 'white' : 'var(--color-text-secondary)')}
            </div>
            <div>
              <div className="font-semibold" style={{ fontSize: 16, marginBottom: 4 }}>{botName} Auto-Responder</div>
              <div className="text-xs text-secondary">
                {enabled
                  ? '🟢 Active • ' + rules.length + ' rules'
                  : '⚫ Inactive — enable to start auto-responding'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setEnabled(!enabled)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s ease',
                background: enabled ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                color: enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                border: enabled ? '1px solid rgba(37,211,102,0.4)' : '1px solid var(--color-border)',
              }}
            >
              {enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {enabled ? 'Enabled' : 'Disabled'}
            </button>

            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: 120 }}
            >
              {saved ? <><CheckCheck size={15} /> Saved!</> : saving ? <><Save size={15} /> Saving...</> : <><Save size={15} /> Save Settings</>}
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
                borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                fontSize: 'var(--text-sm)', transition: 'all 0.2s ease',
                background: activeTab === key ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                border: activeTab === key ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                fontWeight: activeTab === key ? 600 : 500,
              }}
            >
              <Icon size={13} />
              {label}
              {key === 'rules' && rules.length > 0 && (
                <span style={{ background: 'var(--color-primary)', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                  {rules.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════ SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
              <h3 className="font-semibold" style={{ marginBottom: 20, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={16} className="text-accent" /> Bot Identity
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label font-semibold">Bot Display Name</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>The name shown in the chat window.</p>
                  <input className="input" value={botName} onChange={e => setBotName(e.target.value)} placeholder="e.g. Support Bot" />
                </div>
                <div>
                  <label className="label font-semibold">Floating Button Label</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>Text printed next to the trigger button.</p>
                  <input className="input" value={buttonLabel} onChange={e => setButtonLabel(e.target.value)} placeholder="Chat" />
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
              <h3 className="font-semibold" style={{ marginBottom: 20, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} className="text-accent" /> Widget Text & Labels
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label font-semibold">Chat Header Title</label>
                  <input className="input" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Chat with us" />
                </div>
                <div>
                  <label className="label font-semibold">Header Sub-text</label>
                  <input className="input" value={subHeaderText} onChange={e => setSubHeaderText(e.target.value)} placeholder="We typically reply within minutes" />
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
              <h3 className="font-semibold" style={{ marginBottom: 20, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} className="text-accent" /> Bot Messages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label font-semibold">Welcome Message</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>Sent when a new visitor opens the chat.</p>
                  <textarea className="input" rows={3} value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} />
                </div>
                <div>
                  <label className="label font-semibold">Fallback Message</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>Sent when no keyword rule matches.</p>
                  <textarea className="input" rows={3} value={fallbackMessage} onChange={e => setFallbackMessage(e.target.value)} />
                </div>
                <div>
                  <label className="label font-semibold">Offline Message</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>Shown when chatbot is disabled.</p>
                  <textarea className="input" rows={2} value={offlineMessage} onChange={e => setOfflineMessage(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
              <h3 className="font-semibold" style={{ marginBottom: 20, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} style={{ color: '#f59e0b' }} /> Lead Collection
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: collectLeads ? 'var(--color-primary-light)' : 'var(--color-bg-primary)', border: collectLeads ? '1px solid rgba(37,211,102,0.2)' : '1px solid var(--color-border)' }}>
                <div>
                  <div className="font-semibold text-sm">Collect Visitor Information</div>
                  <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Ask for contact details before the chat starts</div>
                </div>
                <button onClick={() => setCollectLeads(!collectLeads)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: collectLeads ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {collectLeads ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {collectLeads && (
                <div>
                  <label className="label font-semibold" style={{ marginBottom: 12 }}>Fields to Collect</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['name', 'email', 'phone'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => toggleLeadField(f)}
                        style={{
                          padding: '8px 20px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                          fontSize: 'var(--text-sm)', fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s',
                          background: leadFields.includes(f) ? 'var(--color-primary-light)' : 'var(--color-bg-primary)',
                          color: leadFields.includes(f) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          border: leadFields.includes(f) ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-secondary" style={{ marginTop: 10 }}>
                    All collected leads will appear in the <strong>Chatbot Leads</strong> section of the sidebar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ APPEARANCE TAB ══ */}
        {activeTab === 'appearance' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Preset Color Palettes */}
              <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
                <h3 className="font-semibold" style={{ marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} className="text-accent" /> Palette Presets
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {PRESET_COLORS.map(palette => {
                    const isSelected = primaryColor === palette.primary && secondaryColor === palette.secondary;
                    return (
                      <button
                        key={palette.label}
                        onClick={() => { setPrimaryColor(palette.primary); setSecondaryColor(palette.secondary); }}
                        style={{
                          background: 'var(--color-bg-primary)',
                          border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                          borderRadius: 12,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', background: palette.primary, display: 'inline-block' }} />
                          <span style={{ width: 16, height: 16, borderRadius: '50%', background: palette.secondary, display: 'inline-block' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)' }}>{palette.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bot Icon Selector */}
              <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
                <h3 className="font-semibold" style={{ marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={16} className="text-accent" /> Chatbot Icon / Avatar
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {ICON_OPTIONS.map(opt => {
                    const isSelected = botIcon === opt.key;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setBotIcon(opt.key)}
                        style={{
                          background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-primary)',
                          border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                          borderRadius: 12,
                          padding: '12px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.2s',
                        }}
                      >
                        <IconComponent size={20} style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="label font-semibold text-xs" style={{ display: 'block', marginBottom: 6 }}>Or Paste Custom Avatar Image URL</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="https://example.com/avatar.png"
                    value={botIcon.startsWith('http://') || botIcon.startsWith('https://') || botIcon.startsWith('/') || botIcon.includes('.') ? botIcon : ''}
                    onChange={e => {
                      const val = e.target.value.trim();
                      setBotIcon(val || 'bot');
                    }}
                  />
                  <p className="text-secondary" style={{ fontSize: 10, marginTop: 4 }}>
                    Supports PNG, JPG, WebP, or SVG. Overrides preset icon selections.
                  </p>
                </div>
              </div>

              {/* Custom Colors & Gradients */}
              <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
                <h3 className="font-semibold" style={{ marginBottom: 20, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Palette size={16} className="text-accent" /> Custom Brand Colors
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label font-semibold">Primary Color</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 44, height: 38, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                      <input type="text" className="input font-mono" style={{ maxWidth: 120 }} value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label font-semibold">Secondary Color</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: 44, height: 38, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                      <input type="text" className="input font-mono" style={{ maxWidth: 120 }} value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                    <div>
                      <div className="font-semibold text-sm">Gradient Header Header</div>
                      <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Blend primary and secondary colors</div>
                    </div>
                    <button onClick={() => setGradient(!gradient)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: gradient ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                      {gradient ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  {gradient && (
                    <div style={{ padding: '4px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="font-semibold text-xs">Gradient Angle</span>
                        <span className="font-mono text-xs">{gradientAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradientAngle}
                        onChange={e => setGradientAngle(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                        <span>0°</span>
                        <span>90°</span>
                        <span>180°</span>
                        <span>270°</span>
                        <span>360°</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
                <h3 className="font-semibold" style={{ marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} className="text-accent" /> Visual Theme style
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['classic', 'glassmorphic'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={{
                        padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        fontSize: 'var(--text-sm)', fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.2s',
                        background: theme === t ? 'var(--color-primary-light)' : 'var(--color-bg-primary)',
                        color: theme === t ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        border: theme === t ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      }}
                    >
                      {t === 'classic' ? 'Classic Solid' : '✨ Premium Glass'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
                <h3 className="font-semibold" style={{ marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Monitor size={16} className="text-accent" /> Widget Position
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      style={{
                        padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        fontSize: 'var(--text-sm)', fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.2s',
                        background: position === p ? 'var(--color-primary-light)' : 'var(--color-bg-primary)',
                        color: position === p ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        border: position === p ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      }}
                    >
                      {p.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="card" style={{
              background: theme === 'glassmorphic'
                ? 'linear-gradient(135deg, #f1f3fd 0%, #eef6fd 50%, #f7f3fd 100%)'
                : 'var(--color-bg-secondary)',
              position: 'sticky',
              top: 20,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 380,
              transition: 'background 0.3s ease'
            }}>
              <h4 className="font-semibold" style={{ marginBottom: 16, fontSize: 13, color: '#334155' }}>🔴 Live Preview</h4>
              
              {theme === 'glassmorphic' ? (
                /* Premium Glassmorphic Chat Panel */
                <div style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(20px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(190%)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.65), 0 20px 45px -10px rgba(118, 93, 203, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {/* Subtle Multi-color Gradient Flow inside the glass */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, ' + primaryColor + '20 0%, ' + secondaryColor + '10 40%, transparent 80%)',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }} />

                  {/* Header */}
                  <div style={{
                    padding: '18px 20px 14px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                    zIndex: 1,
                    position: 'relative',
                  }}>
                    {/* Floating Assistant Aura */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: headerGradientStyle,
                      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                      position: 'relative'
                    }}>
                      {renderBotIcon(22, 'white')}
                    </div>
                    <div style={{ color: '#1e293b', fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>{botName}</div>
                    <div style={{ color: '#64748b', fontSize: 10, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      {subHeaderText || 'Always online'}
                    </div>
                  </div>

                  {/* Message body */}
                  <div style={{ padding: '16px 20px', zIndex: 1, minHeight: 90 }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      padding: '10px 14px',
                      borderRadius: '16px 16px 16px 4px',
                      fontSize: 12,
                      color: '#334155',
                      display: 'inline-block',
                      maxWidth: '85%',
                      lineHeight: 1.45,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)'
                    }}>
                      {welcomeMessage.slice(0, 80)}{welcomeMessage.length > 80 ? '...' : ''}
                    </div>
                  </div>

                  {/* Form area */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    zIndex: 1
                  }}>
                    <div style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: 14,
                      padding: '8px 14px',
                      fontSize: 11,
                      color: '#94a3b8'
                    }}>
                      Ask a question...
                    </div>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: primaryColor,
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.08)'
                    }}>
                      <Send size={12} />
                    </div>
                  </div>
                </div>
              ) : (
                /* Classic solid theme panel */
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <div style={{
                    background: headerGradientStyle,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderBotIcon(18, 'white')}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{botName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{subHeaderText || 'Online'}</div>
                    </div>
                  </div>
                  <div style={{ background: '#ECE5DD', padding: 14, minHeight: 100 }}>
                    <div style={{ background: 'white', padding: '10px 13px', borderRadius: '12px 12px 12px 2px', fontSize: 12, color: '#303030', display: 'inline-block', maxWidth: '80%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {welcomeMessage.slice(0, 80)}{welcomeMessage.length > 80 ? '...' : ''}
                    </div>
                  </div>
                  <div style={{ background: '#F0F0F0', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#999' }}>Message...</div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={14} color="white" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14, display: 'flex', justifyContent: position.includes('right') ? 'flex-end' : 'flex-start' }}>
                {theme === 'glassmorphic' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: primaryColor,
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.7), 0 10px 25px -5px rgba(118, 93, 203, 0.15)',
                    cursor: 'default'
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: headerGradientStyle }} />
                    {renderBotIcon(14, primaryColor)}
                    {buttonLabel || 'Chat'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--radius-pill)', background: primaryColor, color: 'white', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px ' + primaryColor + '55', cursor: 'default' }}>
                    <MessageSquare size={15} />
                    {buttonLabel || 'Chat'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ RULES TAB ══ */}
        {activeTab === 'rules' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
            <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 className="font-semibold" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={16} style={{ color: '#f59e0b' }} /> Auto-Reply Triggers
                  </h3>
                  <p className="text-xs text-secondary" style={{ marginTop: 4 }}>Configure replies when incoming messages contain specified keywords.</p>
                </div>
                <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleAddRule}>
                  <Plus size={14} /> Add Rule
                </button>
              </div>

              {rules.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', border: '2px dashed var(--color-border)', borderRadius: 12 }}>
                  <Zap size={32} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px' }} />
                  <p className="text-secondary text-sm">No rules yet. Add a keyword rule to start auto-responding.</p>
                  <button className="btn btn-primary btn-sm flex items-center gap-2" style={{ margin: '16px auto 0' }} onClick={handleAddRule}>
                    <Plus size={14} /> Add Your First Rule
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rules.map((rule, idx) => (
                    <div key={idx} className="card" style={{ background: 'var(--color-bg-primary)', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 130px 1fr auto', gap: 10, alignItems: 'start' }}>
                      <div>
                        <label className="label" style={{ fontSize: 9, marginBottom: 4, letterSpacing: 1 }}>KEYWORD</label>
                        <input type="text" className="input" placeholder="e.g. price, hours" value={rule.keyword} onChange={e => handleRuleChange(idx, 'keyword', e.target.value)} />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: 9, marginBottom: 4, letterSpacing: 1 }}>MATCH TYPE</label>
                        <select className="input" value={rule.matchType} onChange={e => handleRuleChange(idx, 'matchType', e.target.value as any)}>
                          <option value="contains">Contains</option>
                          <option value="exact">Exact Match</option>
                          <option value="startsWith">Starts With</option>
                        </select>
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: 9, marginBottom: 4, letterSpacing: 1 }}>AUTO-RESPONSE</label>
                        <textarea className="input" rows={2} placeholder="Type responses..." value={rule.response} onChange={e => handleRuleChange(idx, 'response', e.target.value)} />
                      </div>
                      <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)', marginTop: 22, width: 36, flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleRemoveRule(idx)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Template Presets sidebar */}
            <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
              <h3 className="font-semibold" style={{ marginBottom: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} className="text-accent" /> Quick Templates
              </h3>
              <p className="text-xs text-secondary" style={{ marginBottom: 16 }}>
                Click to add common auto-reply rule configurations instantly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {RULE_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.keyword}
                    onClick={() => handleApplyTemplate(tpl)}
                    style={{
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      padding: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="font-bold text-xs" style={{ color: 'var(--color-primary)' }}>Keyword: &quot;{tpl.keyword}&quot;</span>
                      <Plus size={12} className="text-secondary" />
                    </div>
                    <p className="text-secondary text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tpl.response}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ PREVIEW TAB ══ */}
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="font-semibold" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={16} className="text-accent" /> Interactive Floating Widget Simulator
                </h3>
                <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                  Test your live floating chatbot, custom position, lead collection form, and keyword triggers.
                </p>
              </div>
              <button
                className="btn btn-secondary btn-sm flex items-center gap-2"
                onClick={() => {
                  setPreviewMessages([{ sender: 'bot', text: welcomeMessage, time: now() }]);
                  setSimulatedLeadDone(false);
                  setSimulatedName('');
                  setSimulatedEmail('');
                  setSimulatedPhone('');
                  setFloatingOpen(true);
                }}
              >
                Reset Simulator
              </button>
            </div>

            {/* Simulated Website Canvas Container */}
            <div style={{
              width: '100%',
              minHeight: 580,
              height: 580,
              borderRadius: 20,
              position: 'relative',
              overflow: 'visible',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}>
              {/* Simulated Website Navigation Bar */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: primaryColor }} />
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>MyAwesomeSite.com</span>
                </div>
                <div style={{ display: 'flex', gap: 20, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  <span>Home</span>
                  <span>Products</span>
                  <span>Pricing</span>
                  <span>Contact</span>
                </div>
              </div>

              {/* Simulated Website Hero Section */}
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'white' }}>
                <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  LIVE EMBED PREVIEW CANVAS
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 14, marginBottom: 10 }}>
                  Welcome to Our Store
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 460, margin: '0 auto' }}>
                  Experience your floating WhatsApp widget exactly as your website visitors will see and interact with it.
                </p>
              </div>

              {/* FLOATING CHAT POPUP WINDOW */}
              {floatingOpen && (
                <div style={{
                  position: 'absolute',
                  top: position.includes('top') ? 60 : 'auto',
                  bottom: position.includes('bottom') ? 80 : 'auto',
                  left: position.includes('left') ? 24 : 'auto',
                  right: position.includes('right') ? 24 : 'auto',
                  width: 350,
                  maxHeight: 540,
                  borderRadius: 24,
                  overflow: 'hidden',
                  zIndex: 20,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  boxShadow: theme === 'glassmorphic'
                    ? '0 25px 60px -10px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.15)'
                    : '0 20px 40px rgba(0,0,0,0.4)',
                  border: theme === 'glassmorphic'
                    ? '1px solid rgba(255,255,255,0.6)'
                    : '1px solid var(--color-border)',
                  background: theme === 'glassmorphic'
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'var(--color-bg-primary)',
                  backdropFilter: theme === 'glassmorphic' ? 'blur(30px) saturate(180%)' : 'none',
                  WebkitBackdropFilter: theme === 'glassmorphic' ? 'blur(30px) saturate(180%)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'simPopupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  transformOrigin: position.includes('bottom') ? 'bottom center' : 'top center',
                }}>
                  {/* Glassmorphic Centered Header */}
                  {theme === 'glassmorphic' ? (
                    <div style={{
                      padding: '22px 20px 16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      {/* Close Button - absolute top right */}
                      <button onClick={() => setFloatingOpen(false)} style={{
                        position: 'absolute', top: 14, right: 14,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.05)', border: 'none',
                        color: '#94a3b8', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, transition: 'all 0.2s',
                      }}>
                        <X size={14} />
                      </button>

                      {/* Centered Avatar */}
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: `linear-gradient(${gradientAngle}deg, ${primaryColor}25, ${secondaryColor}25)`,
                        border: `2px solid ${primaryColor}30`,
                        boxShadow: `0 8px 24px ${primaryColor}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 8,
                        animation: 'simAvatarFloat 4s ease-in-out infinite',
                      }}>
                        {renderBotIcon(24, primaryColor)}
                      </div>

                      {/* Bot Name */}
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', letterSpacing: '-0.01em' }}>
                        {botName}
                      </div>

                      {/* Status */}
                      <div style={{
                        marginTop: 3, fontSize: 10, color: '#64748b', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: primaryColor, display: 'inline-block',
                          boxShadow: `0 0 6px ${primaryColor}`,
                        }} />
                        {subHeaderText || 'We typically reply within minutes'}
                      </div>
                    </div>
                  ) : (
                    /* Classic Header - left-aligned */
                    <div style={{
                      background: headerGradientStyle,
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      color: 'white', minHeight: 68,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderBotIcon(20, 'white')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{botName}</div>
                          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>{subHeaderText || 'Online'}</div>
                        </div>
                      </div>
                      <button onClick={() => setFloatingOpen(false)} style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: 'transparent', border: 'none', color: 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* Lead Collection Mode or Active Chat Mode */}
                  {collectLeads && !simulatedLeadDone ? (
                    <div style={{
                      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                      background: theme === 'glassmorphic' ? 'transparent' : 'white',
                      flex: 1, overflowY: 'auto'
                    }}>
                      <div className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                        Start Chatting with Us 👋
                      </div>
                      <p className="text-xs" style={{ color: '#64748b' }}>Please enter your details below to start the conversation.</p>

                      {leadFields.includes('name') && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Your Name</label>
                          <input type="text" style={{
                            width: '100%', height: 40, borderRadius: 14,
                            border: theme === 'glassmorphic' ? '1px solid #e2e8f0' : '1px solid #ddd',
                            background: theme === 'glassmorphic' ? '#f8fafc' : 'white',
                            padding: '0 14px', fontSize: 13, color: '#1e293b', outline: 'none',
                          }} placeholder="John Doe" value={simulatedName} onChange={e => setSimulatedName(e.target.value)} />
                        </div>
                      )}
                      {leadFields.includes('email') && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Email Address</label>
                          <input type="email" style={{
                            width: '100%', height: 40, borderRadius: 14,
                            border: theme === 'glassmorphic' ? '1px solid rgba(255,255,255,0.5)' : '1px solid #ddd',
                            background: theme === 'glassmorphic' ? 'rgba(255,255,255,0.5)' : 'white',
                            padding: '0 14px', fontSize: 13, color: '#1e293b', outline: 'none',
                          }} placeholder="john@example.com" value={simulatedEmail} onChange={e => setSimulatedEmail(e.target.value)} />
                        </div>
                      )}
                      {leadFields.includes('phone') && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Phone Number</label>
                          <input type="tel" style={{
                            width: '100%', height: 40, borderRadius: 14,
                            border: theme === 'glassmorphic' ? '1px solid rgba(255,255,255,0.5)' : '1px solid #ddd',
                            background: theme === 'glassmorphic' ? 'rgba(255,255,255,0.5)' : 'white',
                            padding: '0 14px', fontSize: 13, color: '#1e293b', outline: 'none',
                          }} placeholder="+1 555-0199" value={simulatedPhone} onChange={e => setSimulatedPhone(e.target.value)} />
                        </div>
                      )}

                      <button
                        style={{
                          marginTop: 6, width: '100%', height: 42, borderRadius: 14,
                          background: headerGradientStyle, color: 'white',
                          border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => setSimulatedLeadDone(true)}
                      >
                        Start Chat
                      </button>
                    </div>
                  ) : (
                    /* Active Chat Body */
                    <>
                      <div style={{
                        flex: 1, minHeight: 200, maxHeight: 260, overflowY: 'auto',
                        padding: theme === 'glassmorphic' ? 20 : 12,
                        display: 'flex', flexDirection: 'column', gap: 10,
                        background: theme === 'glassmorphic' ? 'transparent' : '#f7f7f8',
                      }}>
                        {previewMessages.map((msg, idx) => (
                          <div key={idx} style={{
                            maxWidth: '84%',
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          }}>
                            <div style={{
                              padding: '11px 14px',
                              borderRadius: 16,
                              fontSize: 13, lineHeight: 1.5,
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                              ...(msg.sender === 'user'
                                ? (theme === 'glassmorphic'
                                  ? {
                                    background: `${primaryColor}20`,
                                    color: '#1e293b',
                                    border: `1px solid ${primaryColor}30`,
                                    borderBottomRightRadius: 4,
                                  }
                                  : {
                                    background: primaryColor,
                                    color: 'white',
                                    borderBottomRightRadius: 5,
                                  })
                                : (theme === 'glassmorphic'
                                  ? {
                                    background: '#f1f5f9',
                                    color: '#1e293b',
                                    border: '1px solid #e2e8f0',
                                    borderBottomLeftRadius: 4,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                  }
                                  : {
                                    background: 'white',
                                    color: '#222',
                                    border: '1px solid #e7e7e7',
                                    borderBottomLeftRadius: 5,
                                  })
                              ),
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {previewTyping && (
                          <div style={{
                            alignSelf: 'flex-start',
                            padding: '9px 12px', borderRadius: 14,
                            background: theme === 'glassmorphic' ? '#f1f5f9' : 'white',
                            border: theme === 'glassmorphic' ? '1px solid #e2e8f0' : '1px solid #e7e7e7',
                            display: 'flex', gap: 4, fontSize: 12, color: '#64748b',
                          }}>
                            {[0, 0.15, 0.3].map((delay, i) => (
                              <div key={i} style={{ width: 5, height: 5, background: '#aaa', borderRadius: '50%', animation: 'pulse 1.2s ' + delay + 's infinite' }} />
                            ))}
                          </div>
                        )}
                        <div ref={previewEndRef} />
                      </div>

                      {/* Input Footer */}
                      <div style={{
                        padding: '12px 14px',
                        background: theme === 'glassmorphic' ? 'rgba(255,255,255,0.7)' : 'white',
                        borderTop: theme === 'glassmorphic' ? '1px solid rgba(0,0,0,0.06)' : '1px solid #e8e8e8',
                        display: 'flex', gap: 8, alignItems: 'center',
                      }}>
                        <input
                          type="text"
                          style={{
                            flex: 1, height: 40, borderRadius: 14, fontSize: 13, color: '#1e293b',
                            padding: '0 14px', outline: 'none', minWidth: 0,
                            background: theme === 'glassmorphic' ? '#f8fafc' : 'white',
                            border: theme === 'glassmorphic' ? '1px solid #e2e8f0' : '1px solid #ddd',
                            transition: 'all 0.2s',
                          }}
                          placeholder="Ask a question..."
                          value={previewInput}
                          onChange={e => setPreviewInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendPreviewMessage()}
                        />
                        <button
                          onClick={sendPreviewMessage}
                          style={{
                            width: 40, height: 40, flexShrink: 0,
                            borderRadius: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            ...(theme === 'glassmorphic'
                              ? {
                                background: '#f8fafc',
                                color: primaryColor,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                              }
                              : {
                                background: primaryColor,
                                color: 'white',
                                border: 'none',
                              }),
                          }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Powered By Footer */}
                  <div style={{
                    padding: '6px 0',
                    textAlign: 'center',
                    background: theme === 'glassmorphic' ? 'rgba(248,250,252,0.8)' : '#fafafa',
                    borderTop: theme === 'glassmorphic' ? '1px solid rgba(0,0,0,0.04)' : '1px solid #f0f0f0',
                  }}>
                    <a
                      href="https://kalpintelligence.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 9, color: '#94a3b8', textDecoration: 'none',
                        fontWeight: 500, letterSpacing: '0.02em',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = primaryColor; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                    >
                      Developed by <span style={{ fontWeight: 600 }}>Kalp Intelligence</span>
                    </a>
                  </div>
                </div>
              )}

              {/* FLOATING TRIGGER BUTTON (CORNER POSITIONED) */}
              <div
                onClick={() => setFloatingOpen(!floatingOpen)}
                style={{
                  position: 'absolute',
                  top: position.includes('top') ? 16 : 'auto',
                  bottom: position.includes('bottom') ? 16 : 'auto',
                  left: position.includes('left') ? 16 : 'auto',
                  right: position.includes('right') ? 16 : 'auto',
                  cursor: 'pointer',
                  zIndex: 30,
                  animation: 'simBtnBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
              >
                {theme === 'glassmorphic' ? (
                  <div
                    className="sim-float-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(20px)',
                      color: primaryColor,
                      fontSize: 13,
                      fontWeight: 700,
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0,0,0,0.1)',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 35px rgba(0,0,0,0.25), 0 6px 16px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)'; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; }}
                  >
                    {renderBotIcon(15, primaryColor)}
                    {buttonLabel || 'Chat'}
                  </div>
                ) : (
                  <div
                    className="sim-float-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-pill)',
                      background: headerGradientStyle,
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: `0 8px 25px rgba(0,0,0,0.3), 0 0 0 0 ${primaryColor}55`,
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.35), 0 0 0 6px ${primaryColor}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3), 0 0 0 0 ${primaryColor}55`; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; }}
                  >
                    {renderBotIcon(16, 'white')}
                    {buttonLabel || 'Chat'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ EMBED TAB ══ */}
        {activeTab === 'embed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.08)', padding: 32, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, ' + primaryColor + '25 0%, transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Globe size={20} style={{ color: primaryColor }} />
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Website Widget Embed</h3>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
                    Paste this snippet just before the closing body tag.
                  </p>
                  <div style={{ position: 'relative' }}>
                    <pre style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 18, color: '#a8ff78', fontSize: 12, lineHeight: 1.7, overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {embedCode}
                    </pre>
                    <button
                      onClick={handleCopy}
                      style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: copied ? '1px solid rgba(37,211,102,0.4)' : '1px solid rgba(255,255,255,0.2)', background: copied ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.1)', color: copied ? '#22c55e' : 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}
                    >
                      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
                  <h4 className="font-semibold" style={{ marginBottom: 14, fontSize: 14 }}>📋 Quick Integration Guide</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { n: 1, title: 'Copy the snippet above', desc: 'Click Copy and grab the embed code.' },
                      { n: 2, title: 'Paste before closing body tag', desc: 'Add it to every page where you want the widget to appear.' },
                      { n: 3, title: 'Save & deploy your site', desc: 'The widget is now active on your site.' },
                    ].map(item => (
                      <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {item.n}
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

        {/* ══════════════════════════════════════════ KNOWLEDGE TAB ══ */}
        {activeTab === 'knowledge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header + Add button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="font-semibold" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} className="text-accent" /> Company Knowledge Base
                </h3>
                <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                  Add detailed information about your company, products, pricing, FAQs and policies. The chatbot uses this to reply to customer questions.
                </p>
              </div>
              <button className="btn btn-primary flex items-center gap-2" onClick={openAddModal}>
                <Plus size={15} /> Add Knowledge
              </button>
            </div>

            {/* Search + Filters */}
            <div className="card" style={{ background: 'var(--color-bg-secondary)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 32, fontSize: 13 }}
                    placeholder="Search knowledge..."
                    value={knowledgeSearch}
                    onChange={e => setKnowledgeSearch(e.target.value)}
                  />
                </div>
                <select
                  className="input"
                  style={{ width: 160, fontSize: 13 }}
                  value={knowledgeCategoryFilter}
                  onChange={e => setKnowledgeCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {KNOWLEDGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="input"
                  style={{ width: 130, fontSize: 13 }}
                  value={knowledgeStatusFilter}
                  onChange={e => setKnowledgeStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={loadKnowledge} title="Refresh">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Knowledge List */}
            {knowledgeLoading ? (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <RefreshCw size={28} style={{ margin: '0 auto 12px', color: 'var(--color-text-tertiary)', animation: 'spin 1s linear infinite' }} />
                <p className="text-secondary text-sm">Loading knowledge base...</p>
              </div>
            ) : knowledgeItems.length === 0 ? (
              <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
                <Brain size={48} style={{ margin: '0 auto 16px', color: 'var(--color-text-tertiary)' }} />
                <h3 className="font-semibold" style={{ marginBottom: 10 }}>No Knowledge Items Yet</h3>
                <p className="text-secondary text-sm" style={{ maxWidth: 400, margin: '0 auto 20px' }}>
                  Add company information, products, pricing, FAQs, and policies so your chatbot can answer customer questions accurately.
                </p>
                <button className="btn btn-primary flex items-center gap-2" style={{ margin: '0 auto' }} onClick={openAddModal}>
                  <Plus size={14} /> Add First Knowledge Item
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {knowledgeItems.map(item => (
                  <div key={item._id} className="card" style={{
                    background: 'var(--color-bg-secondary)',
                    border: item.status === 'active' ? '1px solid var(--color-border)' : '1px solid var(--color-border)',
                    opacity: item.status === 'inactive' ? 0.65 : 1,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span className="font-semibold" style={{ fontSize: 14 }}>{item.title}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: item.status === 'active' ? 'rgba(37,211,102,0.12)' : 'var(--color-bg-tertiary)',
                            color: item.status === 'active' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            border: item.status === 'active' ? '1px solid rgba(37,211,102,0.3)' : '1px solid var(--color-border)',
                          }}>
                            {item.status === 'active' ? '● Active' : '○ Inactive'}
                          </span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            {item.category}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={10} /> Priority {item.priority}
                          </span>
                        </div>
                        <p className="text-secondary" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                          {item.content.slice(0, 180)}{item.content.length > 180 ? '…' : ''}
                        </p>
                        {item.keywords.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Tag size={11} style={{ color: 'var(--color-text-tertiary)' }} />
                            {item.keywords.slice(0, 8).map(kw => (
                              <span key={kw} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                {kw}
                              </span>
                            ))}
                            {item.keywords.length > 8 && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>+{item.keywords.length - 8} more</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                          onClick={() => handleToggleKnowledgeStatus(item)}
                          title={item.status === 'active' ? 'Disable' : 'Enable'}
                        >
                          {item.status === 'active' ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                          {item.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => openEditModal(item)}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-sm flex items-center gap-1"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                          onClick={() => handleDeleteKnowledge(item._id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Test Chat Panel ─────────────────────────────────────────────── */}
            <div className="card" style={{ background: 'var(--color-bg-secondary)', marginTop: 8 }}>
              <h3 className="font-semibold" style={{ marginBottom: 4, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={15} className="text-accent" /> Test Knowledge Matching
              </h3>
              <p className="text-xs text-secondary" style={{ marginBottom: 16 }}>
                Type a customer question to test how the knowledge engine responds. Shows intent, confidence score, and matched knowledge.
              </p>

              {/* Message history */}
              <div style={{ minHeight: 180, maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {testMessages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '40px 0', fontSize: 13 }}>
                    Ask a question to test your knowledge base...
                  </div>
                )}
                {testMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                      color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                      fontSize: 13, lineHeight: 1.5,
                      border: msg.role === 'bot' ? '1px solid var(--color-border)' : 'none',
                    }}>
                      {msg.text}
                    </div>
                    {msg.meta && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, maxWidth: '80%' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                          Intent: {msg.meta.intent}
                        </span>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 20,
                          background: msg.meta.confidence >= 0.70 ? 'rgba(37,211,102,0.1)' : msg.meta.confidence >= 0.40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: msg.meta.confidence >= 0.70 ? '#16a34a' : msg.meta.confidence >= 0.40 ? '#d97706' : '#ef4444',
                          border: `1px solid ${msg.meta.confidence >= 0.70 ? 'rgba(37,211,102,0.3)' : msg.meta.confidence >= 0.40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          Confidence: {Math.round(msg.meta.confidence * 100)}%
                        </span>
                        {msg.meta.knowledgeTitle && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                            📚 {msg.meta.knowledgeTitle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {testLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                    <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Matching knowledge...
                  </div>
                )}
                <div ref={testEndRef} />
              </div>

              {/* Input */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  style={{ flex: 1, fontSize: 13 }}
                  placeholder="e.g. How much commission do you charge restaurants?"
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendTestMessage(); }}
                />
                <button
                  className="btn btn-primary flex items-center gap-2"
                  onClick={sendTestMessage}
                  disabled={testLoading || !testQuery.trim()}
                >
                  <Send size={14} /> Test
                </button>
                {testMessages.length > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setTestMessages([])}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ KNOWLEDGE ADD/EDIT MODAL ══════════════════════════════════════════ */}
      {showKnowledgeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--color-bg-primary)', borderRadius: 20,
            border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
            padding: 32,
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 className="font-bold" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={18} className="text-accent" />
                  {editingItem ? 'Edit Knowledge Item' : 'Add Knowledge Item'}
                </h3>
                <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                  Supports 5,000+ words per entry. Content is stored securely in the database.
                </p>
              </div>
              <button
                onClick={() => setShowKnowledgeModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Title + Category row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label font-semibold">Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="input"
                    placeholder="e.g. Restaurant Commission"
                    value={kForm.title}
                    onChange={e => setKForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label font-semibold">Category</label>
                  <select
                    className="input"
                    value={kForm.category}
                    onChange={e => setKForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {KNOWLEDGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="label font-semibold">Content <span style={{ color: '#ef4444' }}>*</span></label>
                <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>
                  Write detailed information. Supports up to 5,000+ words. The chatbot will use the first 2-3 sentences in replies.
                </p>
                <textarea
                  className="input"
                  style={{ minHeight: 180, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  placeholder="Write your detailed company knowledge here. Be specific — mention exact details, pricing, policies, processes, or any information customers might ask about."
                  value={kForm.content}
                  onChange={e => setKForm(f => ({ ...f, content: e.target.value }))}
                />
                <p className="text-xs text-secondary" style={{ marginTop: 4 }}>
                  {kForm.content.length.toLocaleString()} characters · ~{Math.ceil(kForm.content.split(/\s+/).filter(Boolean).length)} words
                </p>
              </div>

              {/* Keywords + Synonyms row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label font-semibold">Keywords</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>Comma-separated. Primary terms this content answers.</p>
                  <input
                    className="input"
                    placeholder="commission, fee, charges, rate"
                    value={kForm.keywords}
                    onChange={e => setKForm(f => ({ ...f, keywords: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label font-semibold">Synonyms</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>Comma-separated. Alternative words meaning the same thing.</p>
                  <input
                    className="input"
                    placeholder="platform fee, cut, percentage, revenue share"
                    value={kForm.synonyms}
                    onChange={e => setKForm(f => ({ ...f, synonyms: e.target.value }))}
                  />
                </div>
              </div>

              {/* Priority + Status row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label font-semibold">Priority: {kForm.priority}</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>Higher priority items are matched first when multiple items qualify.</p>
                  <input
                    type="range" min={1} max={10} step={1}
                    value={kForm.priority}
                    onChange={e => setKForm(f => ({ ...f, priority: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                    <span>1 (Low)</span><span>10 (High)</span>
                  </div>
                </div>
                <div>
                  <label className="label font-semibold">Status</label>
                  <p className="text-xs text-secondary" style={{ marginBottom: 6 }}>Only Active items are used in chatbot replies.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['active', 'inactive'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setKForm(f => ({ ...f, status: s }))}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                          background: kForm.status === s ? (s === 'active' ? 'rgba(37,211,102,0.12)' : 'rgba(239,68,68,0.08)') : 'var(--color-bg-secondary)',
                          color: kForm.status === s ? (s === 'active' ? 'var(--color-primary)' : '#ef4444') : 'var(--color-text-secondary)',
                          border: kForm.status === s ? `1px solid ${s === 'active' ? 'rgba(37,211,102,0.3)' : 'rgba(239,68,68,0.2)'}` : '1px solid var(--color-border)',
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-secondary" onClick={() => setShowKnowledgeModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex items-center gap-2"
                  onClick={handleSaveKnowledge}
                  disabled={kSaving || !kForm.title.trim() || !kForm.content.trim()}
                >
                  {kSaving ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> {editingItem ? 'Update' : 'Save Knowledge'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

