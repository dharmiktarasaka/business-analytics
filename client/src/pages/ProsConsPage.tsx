import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  Tag,
  FileText,
  Filter
} from 'lucide-react';

export const ProsConsPage: React.FC = () => {
  const { activeBusiness, latestAnalysis } = useBusiness();
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!activeBusiness || !latestAnalysis) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <Scale className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Pros & Cons Audit Unavailable</h2>
        <p className="text-xs text-slate-400">Run your business analysis to generate the fact-checked pros & cons matrix.</p>
        <button
          onClick={() => navigate('/stepper')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start Business Stepper</span>
        </button>
      </div>
    );
  }

  const { pros, cons } = latestAnalysis.prosAndCons;

  const filteredPros = filterCategory === 'all'
    ? pros
    : pros.filter((p) => (p.category || 'General').toLowerCase() === filterCategory.toLowerCase());

  const filteredCons = filterCategory === 'all'
    ? cons
    : cons.filter((c) => (c.category || 'General').toLowerCase() === filterCategory.toLowerCase());

  const categories = Array.from(
    new Set([
      ...pros.map((p) => p.category || 'General'),
      ...cons.map((c) => c.category || 'General')
    ])
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            Honest Business Review
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Pros & Cons: What's Working vs What's Not
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            A clear, honest look at the advantages helping your business and the real problems holding you back.
          </p>
        </div>

        {/* Engine Badge */}
        <div className="shrink-0">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Advisor Active</span>
          </span>
        </div>
      </div>

      {/* Simple Guide Notice */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">How to read this: </span>
          Items marked <span className="text-emerald-400 font-mono text-[10px] px-1.5 py-0.5 bg-emerald-500/20 rounded font-bold">CONFIRMED</span> come directly from your business answers. Items marked <span className="text-amber-400 font-mono text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded font-bold">AI ADVICE</span> are areas the advisor identified that you should pay attention to.
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium mr-1">
            <Filter className="w-3 h-3 text-slate-500" /> Filter:
          </span>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              filterCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Categories ({pros.length + cons.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros Column */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Your Advantages ({filteredPros.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              What's Working
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredPros.map((p, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-bold text-white flex-1">{p.point}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.impact && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.impact} Impact
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        p.type === 'confirmed_fact'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {p.type === 'confirmed_fact' ? 'CONFIRMED' : 'AI DIAGNOSIS'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{p.detail}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[11px] text-slate-500">
                  {p.category && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Tag className="w-3 h-3 text-slate-500" />
                      <span>{p.category}</span>
                    </span>
                  )}
                  {p.evidenceRef && (
                    <span className="flex items-center gap-1 text-emerald-400/80 font-mono text-[10px]">
                      <FileText className="w-3 h-3" />
                      <span>{p.evidenceRef}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cons Column */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-rose-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              Your Problems to Fix ({filteredCons.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
              Needs Work
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredCons.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition-colors space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-bold text-white flex-1">{c.point}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.impact && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          c.impact === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {c.impact} Priority
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        c.type === 'confirmed_fact'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {c.type === 'confirmed_fact' ? 'CONFIRMED' : 'AI ADVICE'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{c.detail}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[11px] text-slate-500">
                  {c.category && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Tag className="w-3 h-3 text-slate-500" />
                      <span>{c.category}</span>
                    </span>
                  )}
                  {c.evidenceRef && (
                    <span className="flex items-center gap-1 text-rose-400/80 font-mono text-[10px]">
                      <FileText className="w-3 h-3" />
                      <span>{c.evidenceRef}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
