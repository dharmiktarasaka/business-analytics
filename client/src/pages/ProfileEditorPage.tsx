import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext.js';
import { IBusinessProfile, BusinessModel, BusinessStage } from '../types/index.js';
import { Building, Save, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfileEditorPage: React.FC = () => {
  const { activeBusiness, updateActiveBusiness } = useBusiness();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<IBusinessProfile | null>(activeBusiness);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!profile) {
    return (
      <div className="p-10 text-center text-slate-400">
        No business profile loaded.
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateActiveBusiness(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            Business Details
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Edit Business Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Update your business name, what you sell, who buys from you, and your key goals.
          </p>
        </div>

        <button
          onClick={() => navigate('/stepper')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Open Step-by-Step Guide</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Step 1: Basics */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">1. Business Basics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business Name</label>
              <input
                type="text"
                value={profile.identity.businessName}
                onChange={(e) => setProfile({ ...profile, identity: { ...profile.identity, businessName: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Industry / Category</label>
              <input
                type="text"
                value={profile.identity.industry}
                onChange={(e) => setProfile({ ...profile, identity: { ...profile.identity, industry: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Who You Sell To</label>
              <select
                value={profile.identity.businessModel}
                onChange={(e) => setProfile({ ...profile, identity: { ...profile.identity, businessModel: e.target.value as BusinessModel } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="b2c">Regular People (B2C)</option>
                <option value="b2b">Other Businesses (B2B)</option>
                <option value="d2c">Both / Online Store (D2C)</option>
                <option value="service">Service-Based</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business Stage</label>
              <select
                value={profile.identity.businessStage}
                onChange={(e) => setProfile({ ...profile, identity: { ...profile.identity, businessStage: e.target.value as BusinessStage } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="startup">Just Starting Out</option>
                <option value="growing">Growing Steady</option>
                <option value="established">Established & Stable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: What You Sell & USP */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">2. What You Sell & What Makes You Special</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">What You Sell / Do</label>
              <input
                type="text"
                value={profile.productsServices.mainOfferings}
                onChange={(e) => setProfile({ ...profile, productsServices: { ...profile.productsServices, mainOfferings: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">What Makes You Special (Why customers choose you)</label>
              <input
                type="text"
                value={profile.productsServices.usp}
                onChange={(e) => setProfile({ ...profile, productsServices: { ...profile.productsServices, usp: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ideal Target Customer</label>
              <input
                type="text"
                value={profile.targetAudience.idealCustomerProfile}
                onChange={(e) => setProfile({ ...profile, targetAudience: { ...profile.targetAudience, idealCustomerProfile: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Priority Problem & Goal */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">3. Challenges & Next Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">#1 Biggest Problem or Headache</label>
              <input
                type="text"
                value={profile.challenges.biggestProblems[0] || ''}
                onChange={(e) => setProfile({ ...profile, challenges: { ...profile.challenges, biggestProblems: [e.target.value] } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Goal for Next 3 to 6 Months</label>
              <input
                type="text"
                value={profile.challenges.shortTermGoals30To90Days[0] || ''}
                onChange={(e) => setProfile({ ...profile, challenges: { ...profile.challenges, shortTermGoals30To90Days: [e.target.value] } })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Profile Updated
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/25 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
