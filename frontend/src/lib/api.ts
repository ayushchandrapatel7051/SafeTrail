const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('authToken');
};

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  // Only auto-redirect on 401 if we had an active token (session expired)
  // Don't redirect for login/register attempts (let them handle the error)
  if (response.status === 401 && authToken && !endpoint.includes('/auth/')) {
    clearAuthToken();
    window.location.href = '/';
    return data;
  }

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// Auth endpoints
export const auth = {
  register: (email: string, password: string, fullName: string) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),

  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Places endpoints
export const places = {
  getAll: () => apiCall('/places'),
  getById: (id: number) => apiCall(`/places/${id}`),
  getByCity: (cityId: number) => apiCall(`/places/city/${cityId}`),
};

// Cities endpoints
export const cities = {
  getAll: () => apiCall('/cities'),
  getById: (id: number) => apiCall(`/cities/${id}`),
};

// Reports endpoints
export const reports = {
  create: (data: {
    place_id: number;
    type: string;
    description: string;
    latitude: number;
    longitude: number;
    photo?: File;
    severity?: number;
  }) => {
    const formData = new FormData();
    formData.append('place_id', data.place_id.toString());
    formData.append('type', data.type);
    formData.append('description', data.description);
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    if (data.severity) formData.append('severity', data.severity.toString());
    if (data.photo) formData.append('photo', data.photo);

    return fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : '',
      },
      body: formData,
    }).then((res) => {
      if (res.status === 401) {
        clearAuthToken();
        window.location.href = '/';
      }
      return res.json();
    });
  },

  getAll: (params?: { status?: string; place_id?: number; type?: string; limit?: number; offset?: number }) =>
    apiCall(`/reports${params ? `?${new URLSearchParams(params as unknown as Record<string, string>).toString()}` : ''}`),

  getById: (id: number) => apiCall(`/reports/${id}`),

  verify: (id: number) =>
    apiCall(`/reports/${id}/verify`, {
      method: 'PATCH',
    }),

  reject: (id: number) =>
    apiCall(`/reports/${id}/reject`, {
      method: 'PATCH',
    }),
};

// Alerts endpoints
export const alerts = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    apiCall(`/alerts${params ? `?${new URLSearchParams(params as unknown as Record<string, string>).toString()}` : ''}`),

  create: (title: string, body: string, severity: number) =>
    apiCall('/alerts', {
      method: 'POST',
      body: JSON.stringify({ title, body, severity }),
    }),
};

// Admin endpoints
export const admin = {
  getDashboard: () => apiCall('/admin/dashboard'),
  getPendingReports: (limit?: number, offset?: number) =>
    apiCall(`/admin/reports/pending${limit ? `?limit=${limit}&offset=${offset ?? 0}` : ''}`),
  getStats: () => apiCall('/admin/stats'),
};

// WebSocket connection
export const createWebSocketConnection = (handlers: {
  onAlert?: (alert: Record<string, unknown>) => void;
  onReportUpdate?: (report: Record<string, unknown>) => void;
  onConnect?: () => void;
  onError?: (error: Event) => void;
}) => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    handlers.onConnect?.();
  };

  ws.onmessage = (event: MessageEvent<string>) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'alert:new') {
        handlers.onAlert?.(message.data);
      } else if (message.type === 'report:updated') {
        handlers.onReportUpdate?.(message.data);
      }
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  ws.onerror = (error: Event) => {
    console.error('WebSocket error:', error);
    handlers.onError?.(error);
  };

  return ws;
};
