import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useBusiness } from '../context/BusinessContext.js';
import { api } from '../services/api.js';
import { IUserSettings } from '../types/index.js';
import {
  Settings,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Save,
  BrainCircuit,
  Bell,
  Sparkles
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeBusiness, deleteCurrentBusiness } = useBusiness();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (err) {
        console.warn('Failed loading settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!activeBusiness) return;
    if (confirm(`Are you sure you want to permanently delete "${activeBusiness.identity.businessName}" and all its analyses?`)) {
      await deleteCurrentBusiness();
      navigate('/dashboard');
    }
  };

  const handlePermanentAccountPurge = async () => {
    if (deleteConfirmation !== 'DELETE PERMANENTLY') {
      alert('Please type "DELETE PERMANENTLY" to confirm.');
      return;
    }

    try {
      await api.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          Configuration & Compliance
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          Settings & Account Governance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage system preferences, currency baselines, AI tuning, and privacy controls.
        </p>
      </div>

      {/* Preferences Form */}
      {settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-blue-400" />
              Strategic Engine Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Currency</label>
                <select
                  value={settings.preferredCurrency}
                  onChange={(e) => setSettings({ ...settings, preferredCurrency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">AI Advisory Temperament</label>
                <select
                  value={settings.aiCreativity}
                  onChange={(e) => setSettings({ ...settings, aiCreativity: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="conservative">Conservative (Risk-averse, highly verified metrics)</option>
                  <option value="balanced">Balanced (Standard consulting perspectives)</option>
                  <option value="creative">Creative (High-growth, novel market vectors)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-blue-500"
                />
                <span>Enable In-App Strategic Alerts</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailReports}
                  onChange={(e) => setSettings({ ...settings, emailReports: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-blue-500"
                />
                <span>Email Quarterly Report Digests</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Preferences Saved
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Danger Zone: Enterprise & Account Deletion */}
      <div className="p-6 rounded-2xl bg-rose-950/10 border border-rose-500/30 space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Enterprise & Privacy Governance (GDPR Compliance)
        </h2>

        {/* Delete current enterprise */}
        {activeBusiness && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-500/20">
            <div>
              <p className="text-xs font-bold text-white">Delete Active Enterprise</p>
              <p className="text-[11px] text-slate-400">
                Remove "{activeBusiness.identity.businessName}" and all associated analyses and chat history.
              </p>
            </div>
            <button
              onClick={handleDeleteBusiness}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              Delete Enterprise
            </button>
          </div>
        )}

        {/* Permanent Account Deletion */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <p className="text-xs font-bold text-rose-400">Permanent Account & Data Purge</p>
            <p className="text-[11px] text-slate-400">
              Irrevocably deletes your user profile, all enterprises, analytical reports, and conversation records.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Everything</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-sm font-bold text-white">Permanent Account Deletion</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action cannot be undone. All businesses, diagnostic drafts, executive analyses, action trackers, and AI advisor sessions will be permanently purged from the database.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">
                Type <span className="font-mono text-rose-400 font-bold">DELETE PERMANENTLY</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE PERMANENTLY"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentAccountPurge}
                disabled={deleteConfirmation !== 'DELETE PERMANENTLY'}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-lg shadow-rose-600/30"
              >
                Confirm Account Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
