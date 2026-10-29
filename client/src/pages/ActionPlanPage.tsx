import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import { api } from '../services/api.js';
import { IActionItem } from '../types/index.js';
import {
  CheckSquare2,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Filter,
  User,
  Target
} from 'lucide-react';

export const ActionPlanPage: React.FC = () => {
  const { activeBusiness, actionItems, refreshAll } = useBusiness();
  const navigate = useNavigate();

  const [filterTimeframe, setFilterTimeframe] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTimeframe, setNewTimeframe] = useState<'7_days' | '30_days' | '90_days' | 'long_term'>('30_days');
  const [newPriority, setNewPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [newOwner, setNewOwner] = useState('');
  const [newMetric, setNewMetric] = useState('');

  if (!activeBusiness) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <CheckSquare2 className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Select an Enterprise</h2>
        <p className="text-xs text-slate-400">Select an enterprise to view and manage its strategic execution roadmap.</p>
      </div>
    );
  }

  const handleToggleStatus = async (item: IActionItem) => {
    const nextStatus = item.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateActionItem(item.id, { status: nextStatus });
      await refreshAll();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteActionItem(id);
      await refreshAll();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createActionItem(activeBusiness.id, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        timeframe: newTimeframe,
        priority: newPriority,
        ownerRole: newOwner.trim() || 'Managing Director',
        successMetric: newMetric.trim() || 'Task completion verified',
        status: 'todo',
        source: 'user_manual'
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      await refreshAll();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const filtered = actionItems.filter((item) => {
    if (filterTimeframe !== 'all' && item.timeframe !== filterTimeframe) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const completedCount = actionItems.filter((i) => i.status === 'completed').length;
  const progressPercent = actionItems.length > 0 ? Math.round((completedCount / actionItems.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <CheckSquare2 className="w-4 h-4" />
            Your To-Do List
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Action Plan & Tasks
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Clear, step-by-step tasks to grow your business, organized by this week, this month, and beyond.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Progress & Filters Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
            {completedCount} of {actionItems.length} Done ({progressPercent}%)
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={filterTimeframe}
            onChange={(e) => setFilterTimeframe(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Deadlines</option>
            <option value="7_days">This Week (7 Days)</option>
            <option value="30_days">This Month (30 Days)</option>
            <option value="90_days">Next 3 Months (90 Days)</option>
            <option value="long_term">Long-Term (6–12 Months)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Tasks</option>
            <option value="todo">To Do</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
            No action items match the selected criteria.
          </div>
        ) : (
          filtered.map((item) => {
            const isDone = item.status === 'completed';
            return (
              <div
                key={item.id}
                className={`p-4 lg:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  isDone
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleStatus(item)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                      {item.title}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.timeframe.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    {item.ownerRole && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Owner: {item.ownerRole}
                      </span>
                    )}
                    {item.successMetric && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-slate-500" />
                        Metric: {item.successMetric}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Remove task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Strategic Action Item</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Directive *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Audit top 5 lead dropout stages in sales funnel"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Details & Rationale</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Why this action is critical and how to execute it..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Timeframe</label>
                  <select
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="7_days">Immediate (Next 7 Days)</option>
                    <option value="30_days">Short-term (Next 30 Days)</option>
                    <option value="90_days">Growth (Next 90 Days)</option>
                    <option value="long_term">Long-term (6–12 Months)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Suggested Owner</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. Founder, Head of Growth"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Success Metric</label>
                  <input
                    type="text"
                    value={newMetric}
                    onChange={(e) => setNewMetric(e.target.value)}
                    placeholder="e.g. 15% increase in conversion"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
