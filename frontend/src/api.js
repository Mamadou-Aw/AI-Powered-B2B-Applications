const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || {};
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.error ? data.error : 'Request failed';
    const details = typeof data === 'object' && data?.details ? data.details : {};
    throw new ApiError(message, response.status, details);
  }

  return data;
}

export const api = {
  dashboard: () => request('/api/dashboard'),
  customers: () => request('/api/customers'),
  createCustomer: (payload) => request('/api/customers', { method: 'POST', body: JSON.stringify(payload) }),
  customerDetail: (id) => request(`/api/customers/${id}`),
  campaigns: () => request('/api/campaigns'),
  createCampaign: (payload) => request('/api/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  behaviors: () => request('/api/behaviors'),
  createBehavior: (payload) => request('/api/behaviors', { method: 'POST', body: JSON.stringify(payload) }),
  notifications: () => request('/api/notifications'),
  suggestCampaign: (customerId, payload) => request(`/api/customers/${customerId}/suggest-campaign`, { method: 'POST', body: JSON.stringify(payload) }),
  messages: () => request('/api/messages'),
  message: (id) => request(`/api/messages/${id}`),
  createMessage: (payload) => request('/api/messages', { method: 'POST', body: JSON.stringify(payload) }),
  updateMessage: (id, payload) => request(`/api/messages/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  generateMessage: (customerId, payload) => request(`/api/customers/${customerId}/generate-message`, { method: 'POST', body: JSON.stringify(payload) }),
  sendMessage: (id) => request(`/api/messages/${id}/send`, { method: 'POST' }),
};

export default API_BASE;
