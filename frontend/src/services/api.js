import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create the base Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    
  },
});

// --- REQUEST INTERCEPTOR ---
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication expired or invalid. Redirecting to login...');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  // Login function
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // UPDATE: Added 'photo' to the select query
    const { data: profileData, error: profileError } = await supabase
      .from('profile')
      .select('first_name, last_name, role, photo') 
      .eq('id', data.user.id)
      .single();

    if (profileError) console.warn("Could not fetch profile:", profileError);

    return { ...data, profile: profileData };
  },

  // ... (keep your existing signUp and logout functions) ...

  // NEW: Function to permanently save profile changes to the database
  updateProfile: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('profile')
      .update(profileData)
      .eq('id', userId);
    if (error) throw error;
    return data;
  },

  // Logout function
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

// --- MODULAR API EXPORTS ---

export const treeApi = {
  getAll: () => apiClient.get('/trees'),
  getMapMarkers: (province) => apiClient.get('/trees/map-markers', {
    params: province ? { province: province } : {}
  }),
  getById: (id) => apiClient.get(`/trees/${id}`),
  create: (data) => apiClient.post('/trees', data),
  update: (id, data) => apiClient.put(`/trees/${id}`, data),
  delete: (id) => apiClient.delete(`/trees/${id}`),
};

export const enterpriseApi = {
  getAll: () => apiClient.get('/enterprises'),
  create: (data) => apiClient.post('/enterprises', data),
  update: (id, data) => apiClient.put(`/enterprises/${id}`, data),
  delete: (id) => apiClient.delete(`/enterprises/${id}`),
};

export const analyticsApi = {
  getSummary: (province) => {
    const config = province && province !== 'All' ? { params: { province: province } } : {};
    return apiClient.get('/analytics/summary', config);
  },
};



export default apiClient;