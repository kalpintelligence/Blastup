'use client';

import Header from '@/components/layout/Header';
import { BookOpen, ExternalLink } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const endpoints = [
  { method: 'POST', path: '/api/auth/login', description: 'Login and get session cookie', auth: false },
  { method: 'POST', path: '/api/auth/logout', description: 'Logout current session', auth: true },
  { method: 'GET', path: '/api/auth/me', description: 'Get current authenticated user', auth: true },
  { method: 'GET', path: '/api/whatsapp/status', description: 'Get WhatsApp connection status', auth: true },
  { method: 'GET', path: '/api/whatsapp/qr', description: 'Get QR code for linking', auth: true },
  { method: 'POST', path: '/api/whatsapp/reconnect', description: 'Reconnect WhatsApp', auth: true },
  { method: 'POST', path: '/api/whatsapp/logout', description: 'Logout WhatsApp session', auth: true },
  { method: 'DELETE', path: '/api/whatsapp/session', description: 'Delete WhatsApp auth session', auth: true },
  { method: 'GET', path: '/api/chats', description: 'List all chats (paginated)', auth: true },
  { method: 'GET', path: '/api/chats/:chatId', description: 'Get single chat', auth: true },
  { method: 'GET', path: '/api/chats/:chatId/messages', description: 'Get messages in a chat', auth: true },
  { method: 'PATCH', path: '/api/chats/:chatId/read', description: 'Mark chat as read', auth: true },
  { method: 'DELETE', path: '/api/chats/messages/:msgId', description: 'Delete message locally', auth: true },
  { method: 'GET', path: '/api/contacts', description: 'List contacts (paginated, with group filter)', auth: true },
  { method: 'GET', path: '/api/contacts/groups', description: 'Get distinct contact groups with count', auth: true },
  { method: 'POST', path: '/api/contacts/groups/update', description: 'Assign or remove groups from contacts', auth: true },
  { method: 'POST', path: '/api/contacts/import', description: 'Bulk import contacts with group assignment', auth: true },
  { method: 'GET', path: '/api/contacts/:jid', description: 'Get single contact', auth: true },
  { method: 'GET', path: '/api/campaigns', description: 'List campaigns (paginated, status filter)', auth: true },
  { method: 'POST', path: '/api/campaigns', description: 'Create & schedule bulk campaign', auth: true },
  { method: 'GET', path: '/api/campaigns/:id', description: 'Get campaign details & analytics summary', auth: true },
  { method: 'GET', path: '/api/campaigns/:id/logs', description: 'Get campaign recipient delivery logs', auth: true },
  { method: 'POST', path: '/api/campaigns/:id/recampaign', description: 'Launch re-campaign to status subset', auth: true },
  { method: 'DELETE', path: '/api/campaigns/:id', description: 'Delete campaign', auth: true },
  { method: 'POST', path: '/api/send/text', description: 'Send text message', auth: true },
  { method: 'POST', path: '/api/send/button', description: 'Send customizable button message (Tap Continue)', auth: true },
  { method: 'POST', path: '/api/send/slider', description: 'Send eCommerce slider / multi-card carousel message', auth: true },
  { method: 'POST', path: '/api/send/image', description: 'Send image (multipart/form-data)', auth: true },
  { method: 'POST', path: '/api/send/video', description: 'Send video (multipart/form-data)', auth: true },
  { method: 'POST', path: '/api/send/audio', description: 'Send audio (multipart/form-data)', auth: true },
  { method: 'POST', path: '/api/send/document', description: 'Send document (multipart/form-data)', auth: true },
  { method: 'GET', path: '/api/chatbot', description: 'Get active Chatbot config, No-Code visual flows & reply mode', auth: true },
  { method: 'PUT', path: '/api/chatbot', description: 'Update Chatbot config, No-Code visual flow nodes & reply mode', auth: true },
  { method: 'POST', path: '/api/chatbot/message', description: 'Public web widget incoming message endpoint', auth: false },
  { method: 'GET', path: '/api/chatbot/status/:chatbotId', description: 'Get public chatbot online status', auth: false },
  { method: 'GET', path: '/api/chatbot/leads', description: 'List captured customer leads from Chatbot', auth: true },
  { method: 'POST', path: '/api/chatbot/leads/:id/reply', description: 'Send direct WhatsApp reply to captured lead', auth: true },
  { method: 'DELETE', path: '/api/chatbot/leads/:id', description: 'Delete captured customer lead', auth: true },
  { method: 'GET', path: '/api/chatbot/knowledge', description: 'List company knowledge base entries for AI', auth: true },
  { method: 'POST', path: '/api/chatbot/knowledge', description: 'Create new company knowledge entry', auth: true },
  { method: 'POST', path: '/api/chatbot/knowledge/test', description: 'Test AI knowledge query matching & confidence', auth: true },
  { method: 'GET', path: '/api/analytics/messages/weekly', description: 'Get 7-day daily sent and received message traffic', auth: true },
  { method: 'GET', path: '/api/logs', description: 'Get audit logs (paginated)', auth: true },
  { method: 'GET', path: '/api/health', description: 'Health check (uptime, memory)', auth: false },
];

const methodColors: Record<string, string> = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PATCH: '#f59e0b',
  DELETE: '#ef4444',
  PUT: '#a855f7',
};

export default function DocsPage() {
  return (
    <>
      <Header title="API Documentation" subtitle="Complete REST API reference & No-Code Chatbot Flow Schema" />
      <div className="page-content">
        {/* Swagger Link */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm" style={{ marginBottom: 4 }}>Interactive Swagger 3.0 Explorer</div>
              <p className="text-xs text-secondary">Full Swagger/OpenAPI 3.0 interactive documentation with live testing on all endpoints including No-Code Chatbot.</p>
            </div>
            <a
              id="docs-swagger-link"
              href={`${API_BASE}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              <ExternalLink size={12} />
              Open Swagger UI
            </a>
          </div>
        </div>

        {/* No-Code Chatbot Flow JSON Guide */}
        <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid #16a34a' }}>
          <div className="card-header">
            <span className="card-title">No-Code Chatbot Flow Schema</span>
            <span className="badge badge-success">Visual Flow API</span>
          </div>
          <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
            Deploy multi-step conversational journeys via <code>PUT /api/chatbot</code> by passing the <code>flows</code> array with keyword triggers, action buttons, and branching targets.
          </p>
          <pre style={{ fontSize: 12 }}>{`PUT /api/chatbot
Content-Type: application/json

{
  "enabled": true,
  "replySource": "nocode", // "nocode" | "standard" | "off"
  "botName": "Urban Studioz Bot",
  "flows": [
    {
      "id": "node-start",
      "type": "flowStart",
      "title": "Flow Start",
      "triggers": ["Hi", "Hello", "Menu", "Help", "Shop"]
    },
    {
      "id": "node-media",
      "type": "mediaButtons",
      "title": "Welcome Menu",
      "imageUrl": "https://example.com/banner.jpg",
      "content": "Welcome to our store 👋 Choose an option below:",
      "buttons": [
        { "id": "b1", "label": "🛍️ Shop Collections", "targetNodeId": "node-catalog" },
        { "id": "b2", "label": "📦 Track Order", "targetNodeId": "node-track" },
        { "id": "b3", "label": "💬 Live Agent", "targetNodeId": "node-agent" }
      ]
    }
  ]
}`}</pre>
        </div>

        {/* Authentication Info */}
        <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--color-accent)' }}>
          <div className="card-header">
            <span className="card-title">Authentication</span>
          </div>
          <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
            All protected routes require an authenticated session. Login via <code>/api/auth/login</code> to receive an HttpOnly session cookie, or pass your API key as <code>x-api-key</code> header.
          </p>
          <pre style={{ fontSize: 12 }}>{`POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}

// Or pass Header: x-api-key: your_api_key_here`}</pre>
        </div>

        {/* Endpoint Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Endpoints</span>
            <span className="badge badge-neutral">{endpoints.length} routes</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Description</th>
                  <th>Auth</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep, i) => (
                  <tr key={i} id={`endpoint-${i}`}>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${methodColors[ep.method]}20`,
                          color: methodColors[ep.method],
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: 'var(--text-xs)' }}>{ep.path}</code>
                    </td>
                    <td className="text-sm">{ep.description}</td>
                    <td>
                      {ep.auth ? (
                        <span className="badge badge-warning">Required</span>
                      ) : (
                        <span className="badge badge-neutral">Public</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
