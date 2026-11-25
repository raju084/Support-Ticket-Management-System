import api from './api';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const ticketAPI = {
  create: (data) => api.post('/tickets', data),
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getMyStats: () => api.get('/tickets/stats/me'),
};

export const commentAPI = {
  add: (ticketId, data) => api.post(`/tickets/${ticketId}/comments`, data),
  getAll: (ticketId) => api.get(`/tickets/${ticketId}/comments`),
  update: (ticketId, commentId, data) => api.put(`/tickets/${ticketId}/comments/${commentId}`, data),
  delete: (ticketId, commentId) => api.delete(`/tickets/${ticketId}/comments/${commentId}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllTickets: (params) => api.get('/admin/tickets', { params }),
  updateStatus: (id, data) => api.patch(`/admin/tickets/${id}/status`, data),
  updatePriority: (id, data) => api.patch(`/admin/tickets/${id}/priority`, data),
  assignTicket: (id, data) => api.patch(`/admin/tickets/${id}/assign`, data),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
};

export const activityAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getByTicket: (ticketId) => api.get(`/activities/ticket/${ticketId}`),
};
