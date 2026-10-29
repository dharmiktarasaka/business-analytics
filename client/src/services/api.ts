import {
  IBusinessProfile,
  IBusinessAnalysis,
  IConversation,
  IChatMessage,
  IReport,
  IActionItem,
  IUserSettings,
  IUser,
  IAdminUserDetail,
  IAdminStats
} from '../types/index.js';

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (!envUrl || !envUrl.trim()) {
    return '/api';
  }
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const API_BASE = resolveApiBaseUrl();

class ApiClient {
  private idToken: string | null = null;
  private currentUser: IUser | null = null;

  setToken(token: string | null, user: IUser | null = null) {
    this.idToken = token;
    this.currentUser = user;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.idToken || localStorage.getItem('auth_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (this.currentUser) {
      headers['x-user-id'] = this.currentUser.uid;
      headers['x-user-email'] = this.currentUser.email;
      headers['x-user-name'] = this.currentUser.displayName;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers as Record<string, string>) };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // --- AUTH ---
  async register(payload: {
    email: string;
    password: string;
    confirmPassword: string;
    mobileNumber: string;
    yearlyRevenue: string;
    displayName?: string;
    businessName?: string;
  }) {
    return this.request<{ success: boolean; user: IUser; token: string; business: IBusinessProfile; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async login(payload: { email: string; password: string }) {
    return this.request<{ success: boolean; user: IUser; token: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: IUser }>('/auth/me');
  }

  async syncUserSession(user: { uid: string; email: string; displayName?: string; photoURL?: string }) {
    return this.request<{ success: boolean; user: IUser }>('/auth/session', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  // --- BUSINESS PROFILES ---
  async getBusinesses(): Promise<IBusinessProfile[]> {
    const res = await this.request<{ success: boolean; businesses: IBusinessProfile[] }>('/businesses');
    return res.businesses;
  }

  async getBusiness(id: string): Promise<IBusinessProfile> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile }>(`/businesses/${id}`);
    return res.business;
  }

  async createBusiness(profile: Partial<IBusinessProfile>): Promise<IBusinessProfile> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile }>('/businesses', {
      method: 'POST',
      body: JSON.stringify(profile)
    });
    return res.business;
  }

  async updateBusiness(id: string, partial: Partial<IBusinessProfile>): Promise<IBusinessProfile> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile }>(`/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
    return res.business;
  }

  async autosaveDraft(id: string, partial: Partial<IBusinessProfile>): Promise<{ business: IBusinessProfile; autosavedAt: string }> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile; autosavedAt: string }>(`/businesses/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
    return { business: res.business, autosavedAt: res.autosavedAt };
  }

  async deleteBusiness(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/businesses/${id}`, {
      method: 'DELETE'
    });
    return res.success;
  }

  // --- ANALYSIS WORKFLOW ---
  async triggerAnalysis(businessId: string): Promise<IBusinessAnalysis> {
    const res = await this.request<{ success: boolean; analysis: IBusinessAnalysis }>(`/businesses/${businessId}/analyze`, {
      method: 'POST'
    });
    return res.analysis;
  }

  async getAnalyses(businessId: string): Promise<IBusinessAnalysis[]> {
    const res = await this.request<{ success: boolean; analyses: IBusinessAnalysis[] }>(`/businesses/${businessId}/analyses`);
    return res.analyses;
  }

  async getAnalysis(id: string): Promise<IBusinessAnalysis> {
    const res = await this.request<{ success: boolean; analysis: IBusinessAnalysis }>(`/analyses/${id}`);
    return res.analysis;
  }

  async retryAnalysis(id: string): Promise<IBusinessAnalysis> {
    const res = await this.request<{ success: boolean; analysis: IBusinessAnalysis }>(`/analyses/${id}/retry`, {
      method: 'POST'
    });
    return res.analysis;
  }

  // --- AI CHAT ---
  async getConversations(businessId: string): Promise<IConversation[]> {
    const res = await this.request<{ success: boolean; conversations: IConversation[] }>(`/businesses/${businessId}/conversations`);
    return res.conversations;
  }

  async createConversation(businessId: string, title?: string): Promise<IConversation> {
    const res = await this.request<{ success: boolean; conversation: IConversation }>(`/businesses/${businessId}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    return res.conversation;
  }

  async getMessages(conversationId: string): Promise<IChatMessage[]> {
    const res = await this.request<{ success: boolean; messages: IChatMessage[] }>(`/conversations/${conversationId}/messages`);
    return res.messages;
  }

  async sendMessage(conversationId: string, content: string): Promise<{ userMessage: IChatMessage; assistantMessage: IChatMessage }> {
    return this.request<{ success: boolean; userMessage: IChatMessage; assistantMessage: IChatMessage }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // --- REPORTS ---
  async generateReport(analysisId: string): Promise<IReport> {
    const res = await this.request<{ success: boolean; report: IReport }>(`/analyses/${analysisId}/reports`, {
      method: 'POST'
    });
    return res.report;
  }

  async getReports(businessId: string): Promise<IReport[]> {
    const res = await this.request<{ success: boolean; reports: IReport[] }>(`/businesses/${businessId}/reports`);
    return res.reports;
  }

  async getReport(id: string): Promise<IReport> {
    const res = await this.request<{ success: boolean; report: IReport }>(`/reports/${id}`);
    return res.report;
  }

  // --- ACTION ITEMS ---
  async getActionItems(businessId: string): Promise<IActionItem[]> {
    const res = await this.request<{ success: boolean; actionItems: IActionItem[] }>(`/businesses/${businessId}/actions`);
    return res.actionItems;
  }

  async createActionItem(businessId: string, item: Partial<IActionItem>): Promise<IActionItem> {
    const res = await this.request<{ success: boolean; actionItem: IActionItem }>(`/businesses/${businessId}/actions`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
    return res.actionItem;
  }

  async updateActionItem(id: string, partial: Partial<IActionItem>): Promise<IActionItem> {
    const res = await this.request<{ success: boolean; actionItem: IActionItem }>(`/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
    return res.actionItem;
  }

  async deleteActionItem(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/actions/${id}`, {
      method: 'DELETE'
    });
    return res.success;
  }

  // --- SETTINGS & GDPR DELETION ---
  async getSettings(): Promise<IUserSettings> {
    const res = await this.request<{ success: boolean; settings: IUserSettings }>('/settings');
    return res.settings;
  }

  async updateSettings(settings: Partial<IUserSettings>): Promise<IUserSettings> {
    const res = await this.request<{ success: boolean; settings: IUserSettings }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
    return res.settings;
  }

  async deleteAccount(): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/account', {
      method: 'DELETE'
    });
    return res.success;
  }

  // --- ADMIN PANEL METHODS ---
  async getAdminUsers(): Promise<{ users: IAdminUserDetail[]; count: number }> {
    const res = await this.request<{ success: boolean; users: IAdminUserDetail[]; count: number }>('/admin/users');
    return { users: res.users, count: res.count };
  }

  async getAdminStats(): Promise<IAdminStats> {
    const res = await this.request<{ success: boolean; stats: IAdminStats }>('/admin/stats');
    return res.stats;
  }

  async createAdminUser(payload: {
    email: string;
    password: string;
    mobileNumber: string;
    yearlyRevenue: string;
    displayName?: string;
    businessName?: string;
    industry?: string;
  }): Promise<IAdminUserDetail> {
    const res = await this.request<{ success: boolean; user: IAdminUserDetail }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.user;
  }

  async deleteAdminUser(uid: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/admin/users/' + uid, {
      method: 'DELETE'
    });
    return res.success;
  }
}

export const api = new ApiClient();
