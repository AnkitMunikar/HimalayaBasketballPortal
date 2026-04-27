// API helper with authentication
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Generic API call
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'API request failed');
  }

  return data;
};

// Events API
export const eventsAPI = {
  getAll: () => apiCall('/api/events/admin/all/'),
  getById: (id) => apiCall(`/api/events/${id}/`),
  approve: (id) => apiCall(`/api/events/admin/${id}/approve/`, { method: 'POST' }),
  reject: (id, reason) => apiCall(`/api/events/admin/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: reason }),
  }),
  update: (id, data) => apiCall(`/api/events/admin/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: () => apiCall('/api/enroll/teams/'),
  getById: (id) => apiCall(`/api/enroll/teams/${id}/`),
  getByEvent: (eventId) => apiCall(`/api/enroll/events/${eventId}/teams/`),
};

// Players API
export const playersAPI = {
  getAll: () => apiCall('/api/enroll/players/'),
  getById: (id) => apiCall(`/api/enroll/players/${id}/`),
};

// Payments API
export const paymentsAPI = {
  getAll: () => apiCall('/api/enroll/payments/'),
  getById: (id) => apiCall(`/api/enroll/payments/${id}/status/`),
};

// Stats API
export const statsAPI = {
  getDashboard: async () => {
    const [events, enrollments, players, payments] = await Promise.all([
      eventsAPI.getAll(),
      enrollmentsAPI.getAll(),
      playersAPI.getAll(),
      apiCall('/api/enroll/payments/'), // Assuming this endpoint exists
    ]);

    return {
      totalEvents: events.length,
      pendingEvents: events.filter(e => e.approval_status === 'pending').length,
      approvedEvents: events.filter(e => e.approval_status === 'approved').length,
      totalEnrollments: enrollments.length,
      totalPlayers: players.length,
      totalRevenue: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    };
  },
};