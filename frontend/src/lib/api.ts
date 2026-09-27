export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
};

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Something went wrong');
  }

  return payload;
}

export const api = {
  getCurrentUser: () => request<{ user: any }>('/api/auth/me'),
  login: (payload: { email?: string; phone?: string; password: string }) => request<{ id: string; name: string; email: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  register: (payload: { name: string; email: string; phone: string; password: string }) => request<{ id: string; name: string; email: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  getProfile: () => request<any>('/api/profile'),
  saveProfile: (payload: any) => request<any>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getPreferences: () => request<any>('/api/preferences'),
  savePreferences: (payload: any) => request<any>('/api/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getMatchingPeople: (userId: string) => request<any[]>(`/api/matching/people?userId=${encodeURIComponent(userId)}`),
  getGroups: () => request<any[]>('/api/groups'),
  createGroup: (payload: any) => request<any>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  joinGroup: (groupId: string) => request<any>(`/api/groups/${groupId}/join`, {
    method: 'POST',
  }),
  getConnections: () => request<any[]>('/api/connections'),
  updateConnection: (connectionId: string, status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED') => request<any>(`/api/connections/${connectionId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  deleteConnection: (connectionId: string) => request<{ message: string }>(`/api/connections/${connectionId}`, {
    method: 'DELETE',
  }),
  getNotifications: () => request<any[]>('/api/notifications'),
  getConversations: () => request<any[]>('/api/chat'),
  getConversation: (conversationId: string) => request<{ messages: any[]; members: any[] }>(`/api/chat/${conversationId}`),
  sendMessage: (conversationId: string, content: string) => request<any>('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ conversationId, content }),
  }),
};
