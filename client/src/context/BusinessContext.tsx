import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';
import { IBusinessProfile, IBusinessAnalysis, IReport, IActionItem } from '../types/index.js';

interface BusinessContextType {
  businesses: IBusinessProfile[];
  activeBusiness: IBusinessProfile | null;
  latestAnalysis: IBusinessAnalysis | null;
  reports: IReport[];
  actionItems: IActionItem[];
  loading: boolean;
  autosaving: boolean;
  lastAutosavedAt: string | null;
  selectBusiness: (id: string) => Promise<void>;
  createNewBusiness: (name?: string) => Promise<IBusinessProfile>;
  updateActiveBusiness: (partial: Partial<IBusinessProfile>) => Promise<IBusinessProfile>;
  saveStepperDraft: (partial: Partial<IBusinessProfile>) => Promise<void>;
  refreshAll: () => Promise<void>;
  deleteCurrentBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<IBusinessProfile[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<IBusinessProfile | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<IBusinessAnalysis | null>(null);
  const [reports, setReports] = useState<IReport[]>([]);
  const [actionItems, setActionItems] = useState<IActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);

  const loadDataForBusiness = useCallback(async (businessId: string) => {
    try {
      const [analyses, rpts, acts] = await Promise.all([
        api.getAnalyses(businessId).catch(() => []),
        api.getReports(businessId).catch(() => []),
        api.getActionItems(businessId).catch(() => [])
      ]);

      const completed = analyses.find((a) => a.status === 'completed') || analyses[0] || null;
      setLatestAnalysis(completed);
      setReports(rpts);
      setActionItems(acts);
    } catch (err) {
      console.warn('Failed loading business sub-data:', err);
    }
  }, []);

  const loadBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setActiveBusiness(null);
      setLatestAnalysis(null);
      return;
    }
    setLoading(true);
    try {
      const list = await api.getBusinesses();
      setBusinesses(list);
      if (list.length > 0) {
        // Find existing stored selected id or default to first
        const savedId = localStorage.getItem('active_business_id');
        const found = list.find((b) => b.id === savedId) || list[0];
        setActiveBusiness(found);
        await loadDataForBusiness(found.id);
      } else {
        setActiveBusiness(null);
        setLatestAnalysis(null);
      }
    } catch (err) {
      console.error('Failed fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  }, [user, loadDataForBusiness]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const selectBusiness = async (id: string) => {
    const found = businesses.find((b) => b.id === id);
    if (found) {
      setActiveBusiness(found);
      localStorage.setItem('active_business_id', id);
      await loadDataForBusiness(id);
    }
  };

  const createNewBusiness = async (name: string = 'New Enterprise'): Promise<IBusinessProfile> => {
    const created = await api.createBusiness({
      identity: {
        businessName: name,
        industry: 'Software & Technology',
        description: '',
        country: 'United States',
        targetMarkets: ['Domestic'],
        businessModel: 'b2b',
        businessStage: 'growing'
      }
    });
    setBusinesses((prev) => [created, ...prev]);
    setActiveBusiness(created);
    localStorage.setItem('active_business_id', created.id);
    setLatestAnalysis(null);
    setReports([]);
    setActionItems([]);
    return created;
  };

  const updateActiveBusiness = async (partial: Partial<IBusinessProfile>): Promise<IBusinessProfile> => {
    if (!activeBusiness) throw new Error('No active business selected');
    const updated = await api.updateBusiness(activeBusiness.id, partial);
    setActiveBusiness(updated);
    setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    return updated;
  };

  const saveStepperDraft = async (partial: Partial<IBusinessProfile>) => {
    if (!activeBusiness) return;
    setAutosaving(true);
    try {
      const res = await api.autosaveDraft(activeBusiness.id, partial);
      setActiveBusiness(res.business);
      setBusinesses((prev) => prev.map((b) => (b.id === res.business.id ? res.business : b)));
      setLastAutosavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Autosave draft failed:', err);
    } finally {
      setAutosaving(false);
    }
  };

  const deleteCurrentBusiness = async () => {
    if (!activeBusiness) return;
    await api.deleteBusiness(activeBusiness.id);
    const remaining = businesses.filter((b) => b.id !== activeBusiness.id);
    setBusinesses(remaining);
    if (remaining.length > 0) {
      setActiveBusiness(remaining[0]);
      localStorage.setItem('active_business_id', remaining[0].id);
      await loadDataForBusiness(remaining[0].id);
    } else {
      setActiveBusiness(null);
      localStorage.removeItem('active_business_id');
      setLatestAnalysis(null);
      setReports([]);
      setActionItems([]);
    }
  };

  const refreshAll = useCallback(async () => {
    if (activeBusiness) {
      await loadDataForBusiness(activeBusiness.id);
    }
  }, [activeBusiness, loadDataForBusiness]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        latestAnalysis,
        reports,
        actionItems,
        loading,
        autosaving,
        lastAutosavedAt,
        selectBusiness,
        createNewBusiness,
        updateActiveBusiness,
        saveStepperDraft,
        refreshAll,
        deleteCurrentBusiness
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
};
