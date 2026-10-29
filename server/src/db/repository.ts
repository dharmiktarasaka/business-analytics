import {
  IUser,
  IBusinessProfile,
  IBusinessAnalysis,
  IConversation,
  IChatMessage,
  IReport,
  IActionItem,
  IUserSettings
} from '../types/index.js';
import {
  UserModel,
  BusinessProfileModel,
  BusinessAnalysisModel,
  ConversationModel,
  ChatMessageModel,
  ReportModel,
  ActionItemModel,
  UserSettingsModel
} from '../models/schemas.js';
import { isUsingFallbackStore } from './connection.js';

// In-Memory store tables for resilient local development / offline demo
class MemoryStorage {
  users: Map<string, IUser> = new Map();
  profiles: Map<string, IBusinessProfile> = new Map();
  analyses: Map<string, IBusinessAnalysis> = new Map();
  conversations: Map<string, IConversation> = new Map();
  messages: Map<string, IChatMessage> = new Map();
  reports: Map<string, IReport> = new Map();
  actionItems: Map<string, IActionItem> = new Map();
  settings: Map<string, IUserSettings> = new Map();
}

const memoryStore = new MemoryStorage();

export const repository = {
  // --- USERS ---
  async getAllUsers(): Promise<IUser[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await UserModel.find().sort({ createdAt: -1 }).lean();
        return (docs || []) as unknown as IUser[];
      } catch (err) {
        console.warn('Error querying MongoDB for getAllUsers:', (err as Error).message);
        return [];
      }
    }
    return Array.from(memoryStore.users.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async deleteUser(uid: string): Promise<boolean> {
    await this.purgeAccount(uid);
    return true;
  },

  async upsertUser(user: IUser): Promise<IUser> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await UserModel.findOneAndUpdate(
          { uid: user.uid },
          { $set: user },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IUser;
      } catch (err) {
        console.warn('Fallback to memory for upsertUser:', (err as Error).message);
      }
    }
    memoryStore.users.set(user.uid, user);
    return user;
  },

  async getUserByUid(uid: string): Promise<IUser | null> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await UserModel.findOne({ uid }).lean();
        return doc as unknown as IUser | null;
      } catch (err) {
        console.warn('Fallback to memory for getUserByUid:', (err as Error).message);
      }
    }
    return memoryStore.users.get(uid) || null;
  },

  async getUserByEmail(email: string): Promise<IUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (!isUsingFallbackStore()) {
      try {
        const doc = await UserModel.findOne({ email: cleanEmail }).lean();
        return doc as unknown as IUser | null;
      } catch (err) {
        console.warn('Fallback to memory for getUserByEmail:', (err as Error).message);
      }
    }
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) return u;
    }
    return null;
  },

  // --- BUSINESS PROFILES ---
  async getBusinessesByOwner(ownerId: string): Promise<IBusinessProfile[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await BusinessProfileModel.find({ ownerId }).sort({ updatedAt: -1 }).lean();
        return docs as unknown as IBusinessProfile[];
      } catch (err) {
        console.warn('Fallback to memory for getBusinessesByOwner:', (err as Error).message);
      }
    }
    return Array.from(memoryStore.profiles.values())
      .filter((p) => p.ownerId === ownerId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getBusinessById(id: string, ownerId: string): Promise<IBusinessProfile | null> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await BusinessProfileModel.findOne({ id, ownerId }).lean();
        return doc as unknown as IBusinessProfile | null;
      } catch (err) {
        console.warn('Fallback to memory for getBusinessById:', (err as Error).message);
      }
    }
    const item = memoryStore.profiles.get(id);
    if (item && item.ownerId === ownerId) return item;
    return null;
  },

  async saveBusiness(profile: IBusinessProfile): Promise<IBusinessProfile> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await BusinessProfileModel.findOneAndUpdate(
          { id: profile.id, ownerId: profile.ownerId },
          { $set: profile },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IBusinessProfile;
      } catch (err) {
        console.warn('Fallback to memory for saveBusiness:', (err as Error).message);
      }
    }
    memoryStore.profiles.set(profile.id, profile);
    return profile;
  },

  async deleteBusiness(id: string, ownerId: string): Promise<boolean> {
    if (!isUsingFallbackStore()) {
      try {
        await Promise.all([
          BusinessProfileModel.deleteOne({ id, ownerId }),
          BusinessAnalysisModel.deleteMany({ businessId: id, ownerId }),
          ConversationModel.deleteMany({ businessId: id, ownerId }),
          ChatMessageModel.deleteMany({ businessId: id, ownerId }),
          ReportModel.deleteMany({ businessId: id, ownerId }),
          ActionItemModel.deleteMany({ businessId: id, ownerId })
        ]);
        return true;
      } catch (err) {
        console.warn('Fallback to memory for deleteBusiness:', (err as Error).message);
      }
    }
    memoryStore.profiles.delete(id);
    for (const [k, v] of memoryStore.analyses.entries()) {
      if (v.businessId === id && v.ownerId === ownerId) memoryStore.analyses.delete(k);
    }
    for (const [k, v] of memoryStore.conversations.entries()) {
      if (v.businessId === id && v.ownerId === ownerId) memoryStore.conversations.delete(k);
    }
    for (const [k, v] of memoryStore.messages.entries()) {
      if (v.businessId === id && v.ownerId === ownerId) memoryStore.messages.delete(k);
    }
    for (const [k, v] of memoryStore.reports.entries()) {
      if (v.businessId === id && v.ownerId === ownerId) memoryStore.reports.delete(k);
    }
    for (const [k, v] of memoryStore.actionItems.entries()) {
      if (v.businessId === id && v.ownerId === ownerId) memoryStore.actionItems.delete(k);
    }
    return true;
  },

  // --- ANALYSES ---
  async getAnalysesByOwner(ownerId: string): Promise<IBusinessAnalysis[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await BusinessAnalysisModel.find({ ownerId }).sort({ createdAt: -1 }).lean();
        return docs as unknown as IBusinessAnalysis[];
      } catch (err) {
        console.warn('Fallback to memory for getAnalysesByOwner:', (err as Error).message);
      }
    }
    return Array.from(memoryStore.analyses.values())
      .filter((a) => a.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAnalysesByBusiness(businessId: string, ownerId: string): Promise<IBusinessAnalysis[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await BusinessAnalysisModel.find({ businessId, ownerId }).sort({ createdAt: -1 }).lean();
        return docs as unknown as IBusinessAnalysis[];
      } catch (err) {
        console.warn('Fallback to memory for getAnalysesByBusiness:', (err as Error).message);
      }
    }
    return Array.from(memoryStore.analyses.values())
      .filter((a) => a.businessId === businessId && a.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAnalysisById(id: string, ownerId: string): Promise<IBusinessAnalysis | null> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await BusinessAnalysisModel.findOne({ id, ownerId }).lean();
        return doc as unknown as IBusinessAnalysis | null;
      } catch (err) {
        console.warn('Fallback to memory for getAnalysisById:', (err as Error).message);
      }
    }
    const item = memoryStore.analyses.get(id);
    if (item && item.ownerId === ownerId) return item;
    return null;
  },

  async saveAnalysis(analysis: IBusinessAnalysis): Promise<IBusinessAnalysis> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await BusinessAnalysisModel.findOneAndUpdate(
          { id: analysis.id, ownerId: analysis.ownerId },
          { $set: analysis },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IBusinessAnalysis;
      } catch (err) {
        console.warn('Fallback to memory for saveAnalysis:', (err as Error).message);
      }
    }
    memoryStore.analyses.set(analysis.id, analysis);
    return analysis;
  },

  // --- CONVERSATIONS & CHAT ---
  async getConversations(businessId: string, ownerId: string): Promise<IConversation[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await ConversationModel.find({ businessId, ownerId }).sort({ lastMessageAt: -1 }).lean();
        return docs as unknown as IConversation[];
      } catch (err) {
        console.warn('Fallback to memory for getConversations:', (err as Error).message);
      }
    }
    return Array.from(memoryStore.conversations.values())
      .filter((c) => c.businessId === businessId && c.ownerId === ownerId)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  },

  async getConversationById(id: string, ownerId: string): Promise<IConversation | null> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await ConversationModel.findOne({ id, ownerId }).lean();
        return doc as unknown as IConversation | null;
      } catch (err) {
        console.warn('Fallback to memory for getConversationById:', (err as Error).message);
      }
    }
    const item = memoryStore.conversations.get(id);
    if (item && item.ownerId === ownerId) return item;
    return null;
  },

  async saveConversation(conv: IConversation): Promise<IConversation> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await ConversationModel.findOneAndUpdate(
          { id: conv.id, ownerId: conv.ownerId },
          { $set: conv },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IConversation;
      } catch (err) {
        console.warn('Fallback to memory for saveConversation:', (err as Error).message);
      }
    }
    memoryStore.conversations.set(conv.id, conv);
    return conv;
  },

  async getMessagesByConversation(conversationId: string, ownerId: string): Promise<IChatMessage[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await ChatMessageModel.find({ conversationId, ownerId }).sort({ createdAt: 1 }).lean();
        return docs as unknown as IChatMessage[];
      } catch (err) {
        console.warn('Fallback to memory for getMessagesByConversation:', (err as Error).message);
      }
    }
    return Array.from(memoryStore.messages.values())
      .filter((m) => m.conversationId === conversationId && m.ownerId === ownerId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async saveChatMessage(message: IChatMessage): Promise<IChatMessage> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await ChatMessageModel.findOneAndUpdate(
          { id: message.id, ownerId: message.ownerId },
          { $set: message },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IChatMessage;
      } catch (err) {
        console.warn('Fallback to memory for saveChatMessage:', (err as Error).message);
      }
    }
    memoryStore.messages.set(message.id, message);
    return message;
  },

  // --- REPORTS ---
  async getReportsByBusiness(businessId: string, ownerId: string): Promise<IReport[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await ReportModel.find({ businessId, ownerId }).sort({ version: -1 }).lean();
        return docs as unknown as IReport[];
      } catch (err) {
        console.warn('Fallback to memory for getReportsByBusiness:', (err as Error).message);
      }
    }
    return Array.from(memoryStore.reports.values())
      .filter((r) => r.businessId === businessId && r.ownerId === ownerId)
      .sort((a, b) => b.version - a.version);
  },

  async getReportById(id: string, ownerId: string): Promise<IReport | null> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await ReportModel.findOne({ id, ownerId }).lean();
        return doc as unknown as IReport | null;
      } catch (err) {
        console.warn('Fallback to memory for getReportById:', (err as Error).message);
      }
    }
    const item = memoryStore.reports.get(id);
    if (item && item.ownerId === ownerId) return item;
    return null;
  },

  async saveReport(report: IReport): Promise<IReport> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await ReportModel.findOneAndUpdate(
          { id: report.id, ownerId: report.ownerId },
          { $set: report },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IReport;
      } catch (err) {
        console.warn('Fallback to memory for saveReport:', (err as Error).message);
      }
    }
    memoryStore.reports.set(report.id, report);
    return report;
  },

  // --- ACTION ITEMS ---
  async getActionItems(businessId: string, ownerId: string): Promise<IActionItem[]> {
    if (!isUsingFallbackStore()) {
      try {
        const docs = await ActionItemModel.find({ businessId, ownerId }).sort({ createdAt: -1 }).lean();
        return docs as unknown as IActionItem[];
      } catch (err) {
        console.warn('Fallback to memory for getActionItems:', (err as Error).message);
      }
    }
    return Array.from(memoryStore.actionItems.values())
      .filter((a) => a.businessId === businessId && a.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async saveActionItem(item: IActionItem): Promise<IActionItem> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await ActionItemModel.findOneAndUpdate(
          { id: item.id, ownerId: item.ownerId },
          { $set: item },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IActionItem;
      } catch (err) {
        console.warn('Fallback to memory for saveActionItem:', (err as Error).message);
      }
    }
    memoryStore.actionItems.set(item.id, item);
    return item;
  },

  async deleteActionItem(id: string, ownerId: string): Promise<boolean> {
    if (!isUsingFallbackStore()) {
      try {
        await ActionItemModel.deleteOne({ id, ownerId });
        return true;
      } catch (err) {
        console.warn('Fallback to memory for deleteActionItem:', (err as Error).message);
      }
    }
    const item = memoryStore.actionItems.get(id);
    if (item && item.ownerId === ownerId) {
      memoryStore.actionItems.delete(id);
      return true;
    }
    return false;
  },

  // --- SETTINGS ---
  async getSettings(ownerId: string): Promise<IUserSettings> {
    if (!isUsingFallbackStore()) {
      try {
        const doc = await UserSettingsModel.findOne({ ownerId }).lean();
        if (doc) return doc as unknown as IUserSettings;
      } catch (err) {
        console.warn('Fallback to memory for getSettings:', (err as Error).message);
      }
    }
    const existing = memoryStore.settings.get(ownerId);
    if (existing) return existing;
    const defaultSettings: IUserSettings = {
      ownerId,
      notificationsEnabled: true,
      emailReports: false,
      theme: 'dark',
      preferredCurrency: 'USD',
      aiCreativity: 'balanced',
      updatedAt: new Date()
    };
    memoryStore.settings.set(ownerId, defaultSettings);
    return defaultSettings;
  },

  async updateSettings(ownerId: string, partial: Partial<IUserSettings>): Promise<IUserSettings> {
    const current = await this.getSettings(ownerId);
    const updated: IUserSettings = { ...current, ...partial, updatedAt: new Date() };
    if (!isUsingFallbackStore()) {
      try {
        const doc = await UserSettingsModel.findOneAndUpdate(
          { ownerId },
          { $set: updated },
          { upsert: true, new: true }
        ).lean();
        return doc as unknown as IUserSettings;
      } catch (err) {
        console.warn('Fallback to memory for updateSettings:', (err as Error).message);
      }
    }
    memoryStore.settings.set(ownerId, updated);
    return updated;
  },

  // --- COMPLETE ACCOUNT PURGE (GDPR / Privacy Compliance) ---
  async purgeAccount(ownerId: string): Promise<void> {
    if (!isUsingFallbackStore()) {
      try {
        await Promise.all([
          UserModel.deleteOne({ uid: ownerId }),
          BusinessProfileModel.deleteMany({ ownerId }),
          BusinessAnalysisModel.deleteMany({ ownerId }),
          ConversationModel.deleteMany({ ownerId }),
          ChatMessageModel.deleteMany({ ownerId }),
          ReportModel.deleteMany({ ownerId }),
          ActionItemModel.deleteMany({ ownerId }),
          UserSettingsModel.deleteOne({ ownerId })
        ]);
      } catch (err) {
        console.warn('Fallback to memory for purgeAccount:', (err as Error).message);
      }
    }
    memoryStore.users.delete(ownerId);
    for (const [k, v] of memoryStore.profiles.entries()) if (v.ownerId === ownerId) memoryStore.profiles.delete(k);
    for (const [k, v] of memoryStore.analyses.entries()) if (v.ownerId === ownerId) memoryStore.analyses.delete(k);
    for (const [k, v] of memoryStore.conversations.entries()) if (v.ownerId === ownerId) memoryStore.conversations.delete(k);
    for (const [k, v] of memoryStore.messages.entries()) if (v.ownerId === ownerId) memoryStore.messages.delete(k);
    for (const [k, v] of memoryStore.reports.entries()) if (v.ownerId === ownerId) memoryStore.reports.delete(k);
    for (const [k, v] of memoryStore.actionItems.entries()) if (v.ownerId === ownerId) memoryStore.actionItems.delete(k);
    memoryStore.settings.delete(ownerId);
  }
};
