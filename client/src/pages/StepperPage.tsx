import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import { api } from '../services/api.js';
import { IBusinessProfile, BusinessModel, BusinessStage, CashFlowSituation } from '../types/index.js';
import {
  Building2,
  Users,
  DollarSign,
  Flag,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Sparkles,
  AlertCircle,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  Check,
  Zap
} from 'lucide-react';

const STEP_TITLES = [
  { id: 1, title: 'Business Basics', description: 'Name, what you do & stage', icon: Building2 },
  { id: 2, title: 'Customers & Sales', description: 'Who buys & why they pick you', icon: Users },
  { id: 3, title: 'Money & Health', description: 'Rough revenue & cash flow', icon: DollarSign },
  { id: 4, title: 'Challenge & Goal', description: '#1 headache & next milestone', icon: Flag },
  { id: 5, title: 'Review & Analyze', description: 'Quick check & 1-click AI advice', icon: Sparkles },
];

// Helper chip suggestions to make it ultra beginner-friendly
const INDUSTRY_SUGGESTIONS = [
  'Bakery / Coffee Shop',
  'Restaurant / Food Service',
  'Web Design & Digital Agency',
  'Plumbing / Home Contractor',
  'E-commerce & Online Store',
  'Consulting / Professional Services',
  'Fitness / Personal Trainer',
  'Retail Store / Boutique',
  'Auto Repair / Mechanics',
  'Salon / Beauty & Spa'
];

const CUSTOMER_CHANNELS = [
  { id: 'Word of mouth & referrals', label: '🗣️ Word of Mouth & Referrals' },
  { id: 'Social media (Instagram, TikTok, FB)', label: '📱 Social Media (Instagram / TikTok)' },
  { id: 'Google Search & Maps', label: '🔍 Google Search & Local Maps' },
  { id: 'Walk-ins & Foot traffic', label: '🚶 Walk-ins & Foot Traffic' },
  { id: 'Direct outreach & Cold calls', label: '📞 Direct Calls & Networking' },
  { id: 'Online Ads (Google, Meta)', label: '🏷️ Paid Online Ads' },
  { id: 'Repeat loyal clients', label: '🔄 Repeat Loyal Clients' }
];

const COMMON_HEADACHES = [
  { label: '📉 Need more customers & leads', text: 'Struggling to find steady new clients and leads' },
  { label: '⏰ Working too many hours / Doing everything myself', text: 'Doing everything manually and running out of time each day' },
  { label: '💸 Profit margins are too low', text: 'Working hard but not keeping enough profit after paying expenses' },
  { label: '👥 Hard to find reliable staff', text: 'Difficult to hire and keep good, trustworthy workers' },
  { label: '🎲 Unpredictable sales month to month', text: 'Sales fluctuate wildly from month to month with no predictability' }
];

const COMMON_GOALS = [
  { label: '🎯 Get 10+ new regular clients', text: 'Attract 10+ new recurring customers or high-ticket projects' },
  { label: '📈 Increase prices & profit margins', text: 'Raise our prices and boost net profits without losing customers' },
  { label: '🤖 Automate repetitive daily work', text: 'Streamline paperwork and automate daily routine tasks to save time' },
  { label: '👥 Hire our first helper or employee', text: 'Hire a reliable helper so the founder can focus on high-level growth' },
  { label: '🚀 Launch a new product or location', text: 'Expand our service offerings or open an online store / second spot' }
];

export const StepperPage: React.FC = () => {
  const { activeBusiness, saveStepperDraft, createNewBusiness } = useBusiness();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IBusinessProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      setFormData(activeBusiness);
      if (activeBusiness.currentStep && activeBusiness.currentStep <= 5) {
        setCurrentStep(activeBusiness.currentStep);
      }
    } else {
      createNewBusiness('My Enterprise').then((biz) => {
        setFormData(biz);
      });
    }
  }, [activeBusiness]);

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const handleNext = async () => {
    // Basic validation
    if (currentStep === 1) {
      if (!formData.identity.businessName.trim()) {
        setErrorMsg('Please enter your business name.');
        return;
      }
      if (!formData.productsServices.mainOfferings.trim()) {
        setErrorMsg('Please enter what your business does or sells.');
        return;
      }
    }

    setErrorMsg(null);
    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      const updated = {
        ...formData,
        currentStep: next,
        completionPercentage: Math.round((next / 5) * 100)
      };
      setFormData(updated);
      await saveStepperDraft(updated);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleManualSave = async () => {
    if (formData) {
      await saveStepperDraft(formData);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    }
  };

  const toggleMarketingChannel = (channel: string) => {
    const current = formData.salesMarketing.primaryChannels || [];
    let updated: string[];
    if (current.includes(channel)) {
      updated = current.filter((c) => c !== channel);
    } else {
      updated = [...current, channel];
    }
    setFormData({
      ...formData,
      salesMarketing: { ...formData.salesMarketing, primaryChannels: updated }
    });
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // Synchronize secondary fields for backwards compatibility with reporting engines
      const monthly = formData.financials.monthlyRevenue || '$5,000 - $10,000';
      const annualEst =
        formData.financials.annualRevenue ||
        (monthly.includes('50,000+')
          ? '$600,000+'
          : monthly.includes('20,000')
          ? '$250,000 - $600,000'
          : monthly.includes('5,000')
          ? '$60,000 - $240,000'
          : '$10,000 - $50,000');

      const primaryProblem = formData.challenges.biggestProblems[0] || 'Need more customers and predictable sales';
      const primaryGoal = formData.challenges.shortTermGoals30To90Days[0] || 'Grow revenue and simplify daily operations';

      const finalProfile: IBusinessProfile = {
        ...formData,
        isDraft: false,
        completionPercentage: 100,
        currentStep: 5,
        identity: {
          ...formData.identity,
          description: formData.productsServices.mainOfferings,
          industry: formData.identity.industry || formData.productsServices.mainOfferings
        },
        financials: {
          ...formData.financials,
          annualRevenue: annualEst
        },
        operations: {
          ...formData.operations,
          operationalBottlenecks: [primaryProblem]
        },
        challenges: {
          ...formData.challenges,
          biggestProblems: [primaryProblem],
          shortTermGoals30To90Days: [primaryGoal],
          aiAdvisorFocusAreas: [primaryProblem, primaryGoal]
        }
      };

      await saveStepperDraft(finalProfile);

      // Trigger AI Analysis workflow
      const analysis = await api.triggerAnalysis(formData.id);
      navigate(`/analysis/${analysis.id}`);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to trigger AI analysis.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-semibold mb-1 border border-blue-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Beginner Friendly • 4 Simple Steps</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Quick Business Diagnostic
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Answer 4 simple, practical questions. No complicated corporate jargon, and everything autosaves.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>{saveToast ? 'Saved!' : 'Save Draft'}</span>
          </button>

          {currentStep === 5 && (
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Analyze My Business</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Steps Tabs */}
      <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEP_TITLES.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div className="truncate">
                  <p className="truncate leading-tight font-medium">{step.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Form Body */}
      <div className="bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl min-h-[440px]">
        {/* STEP 1: ABOUT YOUR BUSINESS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Step 1 of 4</span>
              <h2 className="text-lg font-bold text-white">About Your Business</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tell us who you are and what you do so the AI understands your business.
              </p>
            </div>

            <div className="space-y-5">
              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>1. What is your business name? *</span>
                  <span className="text-[10px] text-blue-400 font-mono">Required</span>
                </label>
                <input
                  type="text"
                  value={formData.identity.businessName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, businessName: e.target.value }
                    })
                  }
                  placeholder="e.g. Bella Bakery, Apex Web Design, Joe's Auto Repair"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* What You Do / Sell */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>2. What does your business do or sell? *</span>
                  <span className="text-[10px] text-blue-400 font-mono">In Simple Words</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.productsServices.mainOfferings}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productsServices: { ...formData.productsServices, mainOfferings: e.target.value },
                      identity: { ...formData.identity, description: e.target.value, industry: formData.identity.industry || e.target.value }
                    })
                  }
                  placeholder="e.g. We bake artisan sourdough breads and sell fresh pastries to local families, cafes, and farmer's markets."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />

                {/* Quick Industry Starter Tags */}
                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span>Or click an example to auto-fill your category:</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {INDUSTRY_SUGGESTIONS.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => {
                          const currentVal = formData.productsServices.mainOfferings;
                          setFormData({
                            ...formData,
                            identity: { ...formData.identity, industry: ind },
                            productsServices: {
                              ...formData.productsServices,
                              mainOfferings: currentVal ? `${currentVal} (${ind})` : ind
                            }
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 text-[11px] border border-slate-700/60 transition-colors"
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stage Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  3. Where is your business right now?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'startup' as BusinessStage,
                      icon: '💡',
                      title: 'Just Starting / Early',
                      desc: 'Finding first customers or recently launched'
                    },
                    {
                      id: 'growing' as BusinessStage,
                      icon: '🚀',
                      title: 'Growing Steady',
                      desc: 'Have regular paying clients and steady sales'
                    },
                    {
                      id: 'established' as BusinessStage,
                      icon: '🏢',
                      title: 'Established Business',
                      desc: 'Stable, profitable, and running smoothly'
                    }
                  ].map((stage) => {
                    const isSelected = formData.identity.businessStage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            identity: { ...formData.identity, businessStage: stage.id }
                          })
                        }
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xl mb-1.5">{stage.icon}</div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {stage.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{stage.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Who do you sell to? */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  4. Who do you sell to?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'b2c' as BusinessModel,
                      icon: '👤',
                      title: 'Regular People (Consumers)',
                      desc: 'Individuals, families, or retail shoppers'
                    },
                    {
                      id: 'b2b' as BusinessModel,
                      icon: '🏢',
                      title: 'Other Businesses',
                      desc: 'Companies, store owners, or offices'
                    },
                    {
                      id: 'd2c' as BusinessModel,
                      icon: '🌐',
                      title: 'Both / Online Store',
                      desc: 'Sell online or mix of both audiences'
                    }
                  ].map((model) => {
                    const isSelected = formData.identity.businessModel === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            identity: { ...formData.identity, businessModel: model.id }
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-lg mb-1">{model.icon}</div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {model.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{model.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CUSTOMERS & SALES */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Step 2 of 4</span>
              <h2 className="text-lg font-bold text-white">Your Customers & What Makes You Special</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tell us who buys from you, how they find you, and why they choose you over competitors.
              </p>
            </div>

            <div className="space-y-5">
              {/* Ideal Customer */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>1. Who is your main customer? *</span>
                  <span className="text-[10px] text-slate-400">Who buys most often?</span>
                </label>
                <input
                  type="text"
                  value={formData.targetAudience.idealCustomerProfile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetAudience: { ...formData.targetAudience, idealCustomerProfile: e.target.value }
                    })
                  }
                  placeholder="e.g. Local homeowners aged 30-55, Busy moms, Small business owners with 5-20 staff, College students"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {[
                    'Local homeowners & families',
                    'Small business owners & founders',
                    'Busy working professionals',
                    'Students & young adults',
                    'High-income luxury clients'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          targetAudience: { ...formData.targetAudience, idealCustomerProfile: chip }
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* How Do Customers Find You */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  2. How do new customers usually find you? (Click all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {CUSTOMER_CHANNELS.map((item) => {
                    const isSelected = formData.salesMarketing.primaryChannels?.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleMarketingChannel(item.id)}
                        className={`px-3 py-2.5 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What makes you special / USP */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>3. What makes your business special? (Why do customers pick you?) *</span>
                  <span className="text-[10px] text-blue-400 font-mono">Your Secret Sauce</span>
                </label>
                <input
                  type="text"
                  value={formData.productsServices.usp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productsServices: { ...formData.productsServices, usp: e.target.value }
                    })
                  }
                  placeholder="e.g. We respond in under 30 minutes, 100% organic local ingredients, friendlier service, 20% cheaper prices"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {[
                    '⚡ Faster turnaround / Same-day delivery',
                    '💎 Higher quality & craftsmanship',
                    '🤝 Friendly personal customer service',
                    '💰 More affordable / Better pricing',
                    '⭐ 5-star local reputation and reviews'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          productsServices: { ...formData.productsServices, usp: chip }
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: MONEY & FINANCIAL HEALTH */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Step 3 of 4</span>
                <h2 className="text-lg font-bold text-white">Money & Financial Health</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rough estimates are completely fine. We use this to give advice that fits your real budget.
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Rough Estimates Fine
              </span>
            </div>

            <div className="space-y-6">
              {/* Monthly Revenue Range */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  1. Roughly how much does your business make each month?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { range: 'Under $1,000 / Starting Out', desc: 'Pre-revenue or first few sales' },
                    { range: '$1,000 - $5,000 / month', desc: 'Starting to get regular orders' },
                    { range: '$5,000 - $20,000 / month', desc: 'Solid consistent monthly income' },
                    { range: '$20,000 - $50,000 / month', desc: 'Healthy established business' },
                    { range: '$50,000+ / month', desc: 'High volume / Scaling rapidly' },
                    { range: 'Prefer not to say', desc: 'Keep financial numbers general' }
                  ].map((item) => {
                    const isSelected = formData.financials.monthlyRevenue === item.range;
                    return (
                      <button
                        key={item.range}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            financials: { ...formData.financials, monthlyRevenue: item.range }
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {item.range}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Flow Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  2. How is cash flow and profit feeling right now?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'positive' as CashFlowSituation,
                      icon: '🟢',
                      title: 'Healthy & Profitable',
                      desc: 'Cash in the bank, we make a clear profit each month'
                    },
                    {
                      id: 'tight' as CashFlowSituation,
                      icon: '🟡',
                      title: 'Breaking Even',
                      desc: 'Covering our expenses, but not much left over'
                    },
                    {
                      id: 'negative' as CashFlowSituation,
                      icon: '🔴',
                      title: 'Tight / Low Cash',
                      desc: 'Cash is tight or clients are paying late'
                    }
                  ].map((cf) => {
                    const isSelected = formData.financials.cashFlowSituation === cf.id;
                    return (
                      <button
                        key={cf.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            financials: { ...formData.financials, cashFlowSituation: cf.id }
                          })
                        }
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xl mb-1.5">{cf.icon}</div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {cf.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{cf.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: BIGGEST CHALLENGE & GOAL */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Step 4 of 4</span>
              <h2 className="text-lg font-bold text-white">Your #1 Headache & Next Goal</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tell us what is holding you back most so the AI knows exactly what to help you fix first.
              </p>
            </div>

            <div className="space-y-6">
              {/* Biggest Problem */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>1. What is the #1 problem or headache in your business right now? *</span>
                  <span className="text-[10px] text-rose-400 font-mono">What's holding you back?</span>
                </label>

                {/* Quick-Pick Headaches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                  {COMMON_HEADACHES.map((item) => {
                    const isSelected = formData.challenges.biggestProblems?.includes(item.text);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            challenges: { ...formData.challenges, biggestProblems: [item.text] },
                            operations: { ...formData.operations, operationalBottlenecks: [item.text] }
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <p className="font-semibold text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.text}</p>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  value={formData.challenges.biggestProblems[0] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      challenges: { ...formData.challenges, biggestProblems: [e.target.value] },
                      operations: { ...formData.operations, operationalBottlenecks: [e.target.value] }
                    })
                  }
                  placeholder="Or describe in your own words: e.g. We spend too much time answering repetitive messages, and sales slow down drastically in summer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Next 3-6 Month Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>2. What is your #1 goal for the next 3 to 6 months? *</span>
                  <span className="text-[10px] text-emerald-400 font-mono">What would success look like?</span>
                </label>

                {/* Quick-Pick Goals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                  {COMMON_GOALS.map((item) => {
                    const isSelected = formData.challenges.shortTermGoals30To90Days?.includes(item.text);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            challenges: {
                              ...formData.challenges,
                              shortTermGoals30To90Days: [item.text],
                              aiAdvisorFocusAreas: [item.text]
                            }
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <p className="font-semibold text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.text}</p>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={formData.challenges.shortTermGoals30To90Days[0] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      challenges: {
                        ...formData.challenges,
                        shortTermGoals30To90Days: [e.target.value],
                        aiAdvisorFocusAreas: [e.target.value]
                      }
                    })
                  }
                  placeholder="Or enter your custom goal: e.g. Reach $15,000/mo in sales, launch our second location, hire 1 assistant"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & GET ADVICE */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Step 5: Review</span>
                <h2 className="text-lg font-bold text-white">Review & Get Personalized Advice</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Everything looks ready! Check your answers below, then click to generate your business analysis.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Ready to Analyze</span>
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-400">1. Business & Stage</span>
                <p className="text-sm font-bold text-white">{formData.identity.businessName}</p>
                <p className="text-xs text-slate-300 line-clamp-2">{formData.productsServices.mainOfferings || 'Not specified'}</p>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {formData.identity.businessStage} stage
                  </span>
                  <span className="uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {formData.identity.businessModel}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-400">2. Customers & Advantage</span>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Target:</strong> {formData.targetAudience.idealCustomerProfile || 'General audience'}
                </p>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">What makes you special:</strong> {formData.productsServices.usp || 'Quality product / service'}
                </p>
                {formData.salesMarketing.primaryChannels?.length > 0 && (
                  <p className="text-[11px] text-slate-400 pt-0.5">
                    Channels: {formData.salesMarketing.primaryChannels.join(', ')}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">3. Money & Health</span>
                <p className="text-sm font-bold text-white">{formData.financials.monthlyRevenue || '$5,000 - $10,000 / month'}</p>
                <p className="text-xs text-slate-300 capitalize">
                  Cash Flow: <span className="text-emerald-400 font-semibold">{formData.financials.cashFlowSituation || 'Positive'}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-400">4. Priority Focus</span>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Main Problem:</strong> {formData.challenges.biggestProblems[0] || 'Need steady leads and sales'}
                </p>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Next Goal:</strong> {formData.challenges.shortTermGoals30To90Days[0] || 'Grow revenue and simplify operations'}
                </p>
              </div>
            </div>

            {/* What you will receive banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-emerald-900/20 border border-blue-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">What you will get instantly:</p>
                <p>
                  • <strong>Honest Pros & Cons:</strong> Clear breakdown of what you are doing right vs what is putting your business at risk.
                </p>
                <p>
                  • <strong>Actionable SWOT:</strong> Concrete strengths, weaknesses, untapped opportunities, and competitive threats.
                </p>
                <p>
                  • <strong>Step-by-Step Growth Plan:</strong> Prioritized tasks you can implement in the next 7 to 30 days to fix problems and make more profit.
                </p>
              </div>
            </div>

            {/* Big Action Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing your business...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Analyze My Business Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <span className="text-xs text-slate-500 font-mono">
          Step {currentStep} of 5
        </span>

        {currentStep < 5 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all hover:translate-x-0.5"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
