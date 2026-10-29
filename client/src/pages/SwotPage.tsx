import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import {
  Compass,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  Building
} from 'lucide-react';

export const SwotPage: React.FC = () => {
  const { activeBusiness, latestAnalysis } = useBusiness();
  const navigate = useNavigate();

  if (!activeBusiness || !latestAnalysis) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <Compass className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">SWOT Analysis Unavailable</h2>
        <p className="text-xs text-slate-400">
          Complete your 9-step business diagnostic to generate an evidence-referenced SWOT Matrix.
        </p>
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

  const { strengths, weaknesses, opportunities, threats } = latestAnalysis.swot;

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          Business Health Overview
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          SWOT Analysis
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          A simple breakdown of your strengths, weaknesses, growth chances, and risks based on your business answers.
        </p>
      </div>

      {/* 4 Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant 1: Strengths */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/20 to-slate-900/40 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Strengths ({strengths.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              What You Do Well
            </span>
          </div>

          <div className="space-y-3">
            {strengths.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <p className="text-xs font-bold text-white">{item.point}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                <div className="pt-1 text-[10px] text-emerald-400/80 font-mono">
                  Source: {item.evidenceRef}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 2: Weaknesses */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/20 to-slate-900/40 border border-rose-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Weaknesses ({weaknesses.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
              Problems to Fix
            </span>
          </div>

          <div className="space-y-3">
            {weaknesses.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <p className="text-xs font-bold text-white">{item.point}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                <div className="pt-1 text-[10px] text-rose-400/80 font-mono">
                  Source: {item.evidenceRef}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 3: Opportunities */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/20 to-slate-900/40 border border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Opportunities ({opportunities.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
              Chances to Grow
            </span>
          </div>

          <div className="space-y-3">
            {opportunities.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <p className="text-xs font-bold text-white">{item.point}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                <div className="pt-1 text-[10px] text-blue-400/80 font-mono">
                  Source: {item.evidenceRef}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 4: Threats */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/20 to-slate-900/40 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Risks & Threats ({threats.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
              Things to Watch
            </span>
          </div>

          <div className="space-y-3">
            {threats.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <p className="text-xs font-bold text-white">{item.point}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                <div className="pt-1 text-[10px] text-amber-400/80 font-mono">
                  Source: {item.evidenceRef}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
