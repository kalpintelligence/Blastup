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
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    request<{ success: boolean; data: any[]; pagination: any }>('/api/contacts', { params }),

  get: (jid: string) =>
    request<{ success: boolean; data: any }>(`/api/contacts/${encodeURIComponent(jid)}`),
};

// ── Send ──────────────────────────────────────────────────────────────
export const sendApi = {
  text: (to: string, text: string) =>
    request('/api/send/text', { method: 'POST', body: JSON.stringify({ to, text }) }),

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

export { ApiError };
