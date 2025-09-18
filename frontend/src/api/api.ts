const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthToken = () => localStorage.getItem('token');

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
};

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (email: string, password: string) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Documents API
export const documentsAPI = {
  getAll: () => apiRequest('/api/docs'),
  
  getById: (id: string) => apiRequest(`/api/docs/${id}`),
  
  create: (document: { title: string; content: string; tags?: string[] }) =>
    apiRequest('/api/docs', {
      method: 'POST',
      body: JSON.stringify(document),
    }),
  
  update: (id: string, document: { title?: string; content?: string; tags?: string[] }) =>
    apiRequest(`/api/docs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(document),
    }),
  
  delete: (id: string) =>
    apiRequest(`/api/docs/${id}`, {
      method: 'DELETE',
    }),
  
  summarize: (id: string) =>
    apiRequest(`/api/docs/${id}/summarize`, {
      method: 'POST',
    }),
  
  generateTags: (id: string) =>
    apiRequest(`/api/docs/${id}/generate-tags`, {
      method: 'POST',
    }),
};

// Search API
export const searchAPI = {
  searchDocuments: async (query: string, semantic = false) => {
    const res = await apiRequest('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query, mode: semantic ? 'semantic' : 'text' }),
    });
    return res.results; //  return array only
  },

  askQuestion: (question: string) =>
    apiRequest('/api/qa', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
