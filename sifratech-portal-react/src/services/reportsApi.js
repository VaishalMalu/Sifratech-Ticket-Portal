import { supabase } from '../lib/supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

async function authenticatedFetch(endpoint, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const reportsApi = {
  // Business Cases
  async getBusinessCases() {
    return authenticatedFetch('/api/reports/cases');
  },

  async getBusinessCaseById(id) {
    return authenticatedFetch(`/api/reports/cases/${id}`);
  },

  async saveBusinessCase(payload) {
    const isUpdate = !!payload.id;
    return authenticatedFetch(isUpdate ? `/api/reports/cases/${payload.id}` : '/api/reports/cases', {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
  },

  // WSR Drafts
  async getWsrDrafts() {
    return authenticatedFetch('/api/reports/wsr-drafts');
  },

  async saveWsrDraft(payload) {
    const isUpdate = !!payload.id;
    return authenticatedFetch(isUpdate ? `/api/reports/wsr-drafts/${payload.id}` : '/api/reports/wsr-drafts', {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
  },

  // WSR Metrics & AI
  async generateMetrics(company, startDate, endDate) {
    return authenticatedFetch('/api/reports/wsr-generate', {
      method: 'POST',
      body: JSON.stringify({ company, startDate, endDate }),
    });
  },

  async generateAISummary(metrics) {
    return authenticatedFetch('/api/reports/wsr-summarize', {
      method: 'POST',
      body: JSON.stringify({ metrics }),
    });
  },

  async generateBCSContent(company, project_name) {
    return authenticatedFetch('/api/reports/bcs-generate', {
      method: 'POST',
      body: JSON.stringify({ company, project_name }),
    });
  }
};
