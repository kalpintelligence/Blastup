// Always relative: routed through the Next.js rewrite in next.config.js so
// requests stay same-origin and wa_token lands as a same-site cookie. A
// direct cross-origin base here breaks auth in production (cookie set on
// the API's origin, never sent back to the app's origin).
const API_BASE = '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    url += `?${query.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data?.message || 'Request failed', data);
  }

  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (username: string, password: string) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ success: boolean; data: { user: any } }>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/api/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),
};

// ── WhatsApp ──────────────────────────────────────────────────────────
export const whatsappApi = {
  getStatus: () => request<{ success: boolean; data: any }>('/api/whatsapp/status'),

  getQR: () => request<{ success: boolean; data: { qr: string } }>('/api/whatsapp/qr'),

  reconnect: () => request('/api/whatsapp/reconnect', { method: 'POST' }),

  logout: () => request('/api/whatsapp/logout', { method: 'POST' }),

  deleteSession: () => request('/api/whatsapp/session', { method: 'DELETE' }),
};

// ── Chats ─────────────────────────────────────────────────────────────
export const chatsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; unreadOnly?: boolean }) =>
    request<{ success: boolean; data: any[]; pagination: any }>('/api/chats', { params }),

  get: (chatId: string) =>
    request<{ success: boolean; data: any }>(`/api/chats/${encodeURIComponent(chatId)}`),

  getMessages: (chatId: string, params?: { page?: number; limit?: number }) =>
    request<{ success: boolean; data: any[]; pagination: any }>(
      `/api/chats/${encodeURIComponent(chatId)}/messages`, { params }
    ),

  markRead: (chatId: string) =>
    request(`/api/chats/${encodeURIComponent(chatId)}/read`, { method: 'PATCH' }),

  deleteMessage: (msgId: string) =>
    request(`/api/chats/messages/${msgId}`, { method: 'DELETE' }),
};

// ── Contacts ──────────────────────────────────────────────────────────
export const contactsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; group?: string }) =>
    request<{ success: boolean; data: any[]; pagination: any }>('/api/contacts', { params }),

  get: (jid: string) =>
    request<{ success: boolean; data: any }>(`/api/contacts/${encodeURIComponent(jid)}`),

  getGroups: () =>
    request<{ success: boolean; data: Array<{ name: string; count: number }> }>('/api/contacts/groups'),

  importContacts: (contacts: Array<{ phone: string; name?: string; groups?: string[] }>, groups?: string[]) =>
    request<{ success: boolean; data: { importedCount: number } }>('/api/contacts/import', {
      method: 'POST',
      body: JSON.stringify({ contacts, groups }),
    }),

  updateGroups: (jids: string[], groups: string[], action: 'add' | 'remove' = 'add') =>
    request<{ success: boolean }>('/api/contacts/groups/update', {
      method: 'POST',
      body: JSON.stringify({ jids, groups, action }),
    }),

  update: (jid: string, data: { name?: string; phone?: string; groups?: string[] }) =>
    request<{ success: boolean; data: any }>(`/api/contacts/${encodeURIComponent(jid)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (jid: string) =>
    request<{ success: boolean }>(`/api/contacts/${encodeURIComponent(jid)}`, { method: 'DELETE' }),
};


// ── Campaigns ─────────────────────────────────────────────────────────
export const campaignsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    request<{ success: boolean; data: any[]; pagination: any }>('/api/campaigns', { params }),

  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/api/campaigns/${id}`),

  create: (data: {
    name: string;
    templateText: string;
    mediaUrl?: string;
    interactiveType?: 'none' | 'button' | 'slider';
    buttons?: any[];
    sliderItems?: any[];
    targetGroups?: string[];
    scheduledAt: string;
  }) =>
    request<{ success: boolean; data: any }>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLogs: (id: string, params?: { page?: number; limit?: number; status?: string }) =>
    request<{ success: boolean; data: any[]; pagination: any }>(`/api/campaigns/${id}/logs`, { params }),

  reCampaign: (id: string, data: { name?: string; filterStatus: string; scheduledAt: string }) =>
    request<{ success: boolean; data: any }>(`/api/campaigns/${id}/recampaign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/campaigns/${id}`, { method: 'DELETE' }),
};

// ── Send ──────────────────────────────────────────────────────────────
export const sendApi = {
  text: (to: string, text: string) =>
    request('/api/send/text', { method: 'POST', body: JSON.stringify({ to, text }) }),

  button: (to: string, text: string, buttons: any[], footer?: string) =>
    request('/api/send/button', {
      method: 'POST',
      body: JSON.stringify({ to, text, buttons, footer }),
    }),

  slider: (to: string, title: string, text: string, items: any[], footer?: string) =>
    request('/api/send/slider', {
      method: 'POST',
      body: JSON.stringify({ to, title, text, items, footer }),
    }),

  media: (type: 'image' | 'video' | 'audio' | 'document', formData: FormData) => {
    // FormData — don't set Content-Type (browser sets it with boundary)
    return fetch(`${API_BASE}/api/send/${type}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new ApiError(r.status, data?.message || 'Send failed', data);
      return data;
    });
  },
};

// ── Logs ──────────────────────────────────────────────────────────────
export const logsApi = {
  list: (params?: { page?: number; limit?: number; level?: string; category?: string }) =>
    request<{ success: boolean; data: any[]; pagination: any }>('/api/logs', { params }),
};

// ── Health ────────────────────────────────────────────────────────────
export const healthApi = {
  get: () => request<{ success: boolean; data: any }>('/api/health'),
};

// ── API Keys ──────────────────────────────────────────────────────────
export const keysApi = {
  list: () => request<{ success: boolean; data: any[] }>('/api/keys'),
  create: (name: string) => request<{ success: boolean; message: string; data: any }>('/api/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  delete: (id: string) => request<{ success: boolean }>(`/api/keys/${id}`, { method: 'DELETE' }),
};

// ── Chatbot ─────────────────────────────────────────────────────────
export const chatbotApi = {
  get: () => request<{ success: boolean; data: any }>('/api/chatbot'),

  update: (data: {
    enabled: boolean;
    botName?: string;
    botIcon?: string;
    welcomeMessage?: string;
    fallbackMessage?: string;
    offlineMessage?: string;
    headerText?: string;
    subHeaderText?: string;
    buttonLabel?: string;
    primaryColor?: string;
    secondaryColor?: string;
    gradientAngle?: number;
    gradient?: boolean;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: 'classic' | 'glassmorphic';
    whitelistedDomains?: string[];
    rules?: Array<{ keyword: string; response: string; matchType: 'exact' | 'contains' | 'startsWith' }>;
    collectLeads?: boolean;
    leadFields?: Array<'name' | 'email' | 'phone'>;
  }) => request<{ success: boolean; data: any }>('/api/chatbot', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ── Chatbot Leads ─────────────────────────────────────────────────
export const chatbotLeadsApi = {
  list: (params?: { page?: number; limit?: number; domain?: string }) =>
    request<{ success: boolean; data: any[]; pagination: any }>('/api/chatbot/leads', { params }),
  reply: (id: string, text: string) =>
    request<{ success: boolean; data: any }>(`/api/chatbot/leads/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/chatbot/leads/${id}`, { method: 'DELETE' }),
};

// ── Company Knowledge ─────────────────────────────────────────────
export const knowledgeApi = {
  list: (params?: { category?: string; status?: string; search?: string }) =>
    request<{ success: boolean; data: any[] }>('/api/chatbot/knowledge', { params }),

  create: (data: {
    title: string;
    category: string;
    content: string;
    keywords: string[];
    synonyms: string[];
    priority: number;
    status: 'active' | 'inactive';
  }) =>
    request<{ success: boolean; data: any }>('/api/chatbot/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{
    title: string;
    category: string;
    content: string;
    keywords: string[];
    synonyms: string[];
    priority: number;
    status: 'active' | 'inactive';
  }>) =>
    request<{ success: boolean; data: any }>(`/api/chatbot/knowledge/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/chatbot/knowledge/${id}`, { method: 'DELETE' }),

  test: (message: string, sessionId?: string) =>
    request<{
      success: boolean;
      data: {
        message: string;
        reply: string;
        intent: string;
        confidence: number;
        knowledgeId: string | null;
        knowledgeTitle: string | null;
        suggestions: string[];
      };
    }>('/api/chatbot/knowledge/test', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),
};


// ── Safe Mode ─────────────────────────────────────────────────────────
export const safeModeApi = {
  getStatus: (instanceId: string) =>
    request<{ success: boolean; data: any }>(`/api/safemode/${encodeURIComponent(instanceId)}/status`),
  
  enable: (instanceId: string, tier: number = 1) =>
    request<{ success: boolean; data: any }>(`/api/safemode/${encodeURIComponent(instanceId)}/enable`, {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),

  disable: (instanceId: string) =>
    request<{ success: boolean; data: any }>(`/api/safemode/${encodeURIComponent(instanceId)}/disable`, {
      method: 'POST',
    }),
};

export { ApiError };


