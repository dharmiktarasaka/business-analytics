import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import { api } from '../services/api.js';
import { IGrowthOpportunity } from '../types/index.js';
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  ArrowRight,
  Filter,
  CheckSquare2
} from 'lucide-react';

export const GrowthPage: React.FC = () => {
  const { activeBusiness, latestAnalysis, refreshAll } = useBusiness();
  const navigate = useNavigate();

  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  if (!activeBusiness || !latestAnalysis) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <TrendingUp className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Growth Roadmap Unavailable</h2>
        <p className="text-xs text-slate-400">Complete your business stepper to generate ranked growth opportunities.</p>
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

  const opportunities = latestAnalysis.growthOpportunities || [];
  const filtered = filterImpact === 'all'
    ? opportunities
    : opportunities.filter((o) => o.businessImpact.toLowerCase() === filterImpact.toLowerCase());

  const handleConvertToAction = async (opp: IGrowthOpportunity) => {
    try {
      await api.createActionItem(activeBusiness.id, {
        title: opp.title,
        description: opp.description,
        category: 'Growth Initiative',
        priority: opp.businessImpact === 'High' ? 'urgent' : 'high',
        timeframe: opp.expectedTimeToImplement.includes('1') ? '7_days' : '30_days',
        status: 'todo',
        source: 'ai_action_plan'
      });
      setAddedMap((prev) => ({ ...prev, [opp.id]: true }));
      await refreshAll();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            Grow Your Business
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Growth Ideas
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Practical ideas to get more clients, increase sales, and grow your profit without overwhelming your team.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Growth Ideas</option>
            <option value="high">Big Impact Only</option>
            <option value="medium">Medium Impact</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((opp) => (
          <div
            key={opp.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  #{opp.recommendedPriority}
                </span>
                <h3 className="text-sm font-bold text-white">{opp.title}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  opp.businessImpact === 'High'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {opp.businessImpact} Impact
                </span>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {opp.implementationEffort} Effort
                </span>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {opp.confidenceLevel} Confidence
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {opp.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Time Needed</span>
                <span className="text-slate-200 font-medium">{opp.expectedTimeToImplement}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Estimated Cost</span>
                <span className="text-slate-200 font-medium">{opp.estimatedCostRange || '$0 - $250'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">What You Need</span>
                <span className="text-slate-200 font-medium truncate block">
                  {opp.dependencies.join(', ') || 'None needed'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleConvertToAction(opp)}
                disabled={addedMap[opp.id]}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  addedMap[opp.id]
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 active:scale-95'
                }`}
              >
                <CheckSquare2 className="w-3.5 h-3.5" />
                <span>{addedMap[opp.id] ? 'Added to To-Do List!' : 'Add to My Tasks'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
