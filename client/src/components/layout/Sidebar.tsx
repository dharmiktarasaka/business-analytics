import React from 'react';
import { NavLink } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext.js';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquareText,
  Compass,
  Scale,
  TrendingUp,
  CheckSquare2,
  FileText,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
  { to: '/stepper', label: 'Business Questions', icon: ClipboardList },
  { to: '/swot', label: 'SWOT Analysis', icon: Compass },
  { to: '/pros-cons', label: 'Pros & Cons', icon: Scale },
  { to: '/growth', label: 'Growth Ideas', icon: TrendingUp },
  { to: '/actions', label: 'Action Plan & Tasks', icon: CheckSquare2 },
  { to: '/chat', label: 'Ask AI Advisor', icon: MessageSquareText },
  { to: '/reports', label: 'Business Reports', icon: FileText }
];

export const Sidebar: React.FC = () => {
  const { activeBusiness, latestAnalysis } = useBusiness();

  const completion = activeBusiness?.completionPercentage || 0;

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#090D16] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Profile Completion and Status Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 m-3 rounded-2xl border">
        {activeBusiness ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Profile Completed</span>
              <span className="text-blue-400 font-bold">{completion}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="capitalize">{activeBusiness.identity.businessStage} stage</span>
              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {activeBusiness.identity.businessModel}
              </span>
            </div>

            {latestAnalysis?.status === 'running' && (
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span className="truncate">Analyzing business...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-2">
            No enterprise selected.
          </div>
        )}
      </div>
    </aside>
  );
};
