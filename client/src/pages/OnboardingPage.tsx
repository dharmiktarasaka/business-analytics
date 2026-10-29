import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useBusiness } from '../context/BusinessContext.js';
import {
  Sparkles,
  Zap,
  Building2,
  Compass,
  TrendingUp,
  FileText,
  ArrowRight
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { businesses, selectBusiness, createNewBusiness } = useBusiness();
  const navigate = useNavigate();

  const handleStartFresh = async () => {
    await createNewBusiness('My Business');
    navigate('/stepper');
  };

  const handleOpenExisting = async (id: string) => {
    await selectBusiness(id);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Hero Welcome Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, Honest AI Business Advice</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Welcome, {user?.displayName || 'Business Owner'}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">
          Tell us a few simple things about what you sell and who buys from you. We'll give you honest feedback on what is working well, what is holding you back, and a clear step-by-step plan to get more customers and profit.
        </p>

        {/* Primary CTA */}
        <div className="pt-2">
          <button
            onClick={handleStartFresh}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-blue-600/30 inline-flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Analyze My Business (4 Quick Steps)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Value Props Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Honest Pros & Cons</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            See what you are doing right and discover the hidden risks or bottlenecks slowing you down.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Actionable Growth Plan</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get practical, prioritized tasks for the next 7 to 30 days to get more customers and boost profits.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Clean PDF & Excel Reports</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Download your personalized business diagnostic report with 1 click to save or share.
          </p>
        </div>
      </div>

      {/* Reopen Existing Business Profiles if available */}
      {businesses.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Your Saved Businesses
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => handleOpenExisting(b.id)}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    {b.identity.businessName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {b.identity.industry || b.productsServices?.mainOfferings || 'General'} • {b.identity.businessStage} stage
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
