import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import { exportReportToPDF } from '../services/pdfExport.js';
import { exportAnalysisToExcel } from '../services/excelExport.js';
import { api } from '../services/api.js';
import { IActionItem } from '../types/index.js';
import {
  Sparkles,
  Compass,
  TrendingUp,
  Scale,
  CheckSquare2,
  FileText,
  Building,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Play,
  RotateCcw,
  ClipboardList,
  Check,
  Circle,
  HelpCircle,
  Clock,
  Target,
  ArrowUpRight,
  Edit3
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { activeBusiness, latestAnalysis, reports, actionItems, refreshAll } = useBusiness();
  const navigate = useNavigate();

  // Tab state for the Complete Analytic Report view
  const [activeReportTab, setActiveReportTab] = useState<'actions' | 'proscons' | 'growth' | 'swot' | 'overview'>('actions');
  const [taskFilter, setTaskFilter] = useState<'all' | '7_days' | '30_days' | '90_days'>('all');

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);

  const showNotice = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setStatusNotice({ message, type });
    setTimeout(() => setStatusNotice(null), 5000);
  };

  const handleRunAnalysis = async () => {
    if (!activeBusiness) return;
    setRunningAnalysis(true);
    try {
      const analysis = await api.triggerAnalysis(activeBusiness.id);
      navigate(`/analysis/${analysis.id}`);
    } catch (err) {
      navigate('/stepper');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleQuickPdfDownload = async () => {
    if (!activeBusiness) return;

    if (!latestAnalysis) {
      showNotice('Please complete your Business Diagnostic first to generate your report.', 'warn');
      return;
    }

    setDownloadingPdf(true);
    try {
      let reportToExport = reports[0];
      if (!reportToExport) {
        reportToExport = await api.generateReport(latestAnalysis.id);
        await refreshAll();
      }
      exportReportToPDF(reportToExport, activeBusiness, latestAnalysis);
      showNotice('Executive PDF Report downloaded successfully!', 'success');
    } catch (err) {
      showNotice((err as Error).message || 'Failed to generate PDF.', 'warn');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleQuickExcelExport = () => {
    if (!activeBusiness) return;

    if (!latestAnalysis) {
      showNotice('Please complete your Business Diagnostic first to export your data to Excel.', 'warn');
      return;
    }

    setExportingExcel(true);
    try {
      exportAnalysisToExcel(activeBusiness, latestAnalysis, actionItems);
      showNotice('Business Analysis workbook exported to Excel!', 'success');
    } catch (err) {
      showNotice((err as Error).message || 'Failed to export Excel.', 'warn');
    } finally {
      setTimeout(() => setExportingExcel(false), 800);
    }
  };

  // Toggle action item task status (Done / Pending)
  const handleToggleTask = async (item: IActionItem) => {
    const nextStatus = item.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateActionItem(item.id, { status: nextStatus });
      await refreshAll();
      showNotice(
        nextStatus === 'completed' ? `Great job! "${item.title}" marked as complete.` : `Task moved back to To-Do.`,
        'success'
      );
    } catch (err) {
      showNotice((err as Error).message || 'Failed to update task.', 'warn');
    }
  };

  // Ask AI about a specific task
  const handleAskAIAboutTask = (taskTitle: string) => {
    if (!activeBusiness) return;
    const prompt = `I need practical, beginner-friendly advice on how to execute this task for my business (${activeBusiness.identity.businessName}):\n\n"${taskTitle}"\n\nPlease give me a clear step-by-step checklist on what to do first.`;
    navigate('/chat', { state: { prompt } });
  };

  if (!activeBusiness) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <Building className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Business Selected</h2>
        <p className="text-xs text-slate-400">
          Select or create a business profile to view your analysis and personalized action plan.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Get Started</span>
        </button>
      </div>
    );
  }

  // Calculated action items statistics
  const completedTasks = actionItems.filter((t) => t.status === 'completed').length;
  const totalTasks = actionItems.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = actionItems.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.timeframe === taskFilter;
  });

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Status Banner */}
      {statusNotice && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between transition-all animate-fadeIn ${
            statusNotice.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : statusNotice.type === 'warn'
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
              : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{statusNotice.message}</span>
          </div>
        </div>
      )}

      {/* Main Executive Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#10172A] to-slate-900 border border-slate-800 p-6 lg:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            {/* Stage and category pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {activeBusiness.identity.businessStage} Stage
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {activeBusiness.identity.industry || 'Commercial & Services'}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {activeBusiness.financials.monthlyRevenue || activeBusiness.financials.annualRevenue || 'Revenue Tracked'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeBusiness.identity.businessName}
            </h1>

            {/* Plain English summary */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {latestAnalysis?.executiveSummary.overview ||
                activeBusiness.identity.description ||
                'Answer simple business questions to get honest advice, find issues, and see how to grow your business.'}
            </p>

            {/* Quick 3 Takeaway Cards */}
            {latestAnalysis && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> What's Working
                  </span>
                  <p className="text-xs font-semibold text-white mt-1 line-clamp-1">
                    {latestAnalysis.swot.strengths[0]?.point || activeBusiness.productsServices.usp || 'Clear unique offer'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> #1 Thing to Fix
                  </span>
                  <p className="text-xs font-semibold text-white mt-1 line-clamp-1">
                    {latestAnalysis.swot.weaknesses[0]?.point || activeBusiness.challenges.biggestProblems[0] || 'Unsteady leads'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Top Growth Lever
                  </span>
                  <p className="text-xs font-semibold text-white mt-1 line-clamp-1">
                    {latestAnalysis.growthOpportunities[0]?.title || 'Systematize customer acquisition'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
            {/* Download PDF button (Highlighted) */}
            <button
              onClick={handleQuickPdfDownload}
              disabled={downloadingPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              title="Download easy-to-read PDF report"
            >
              {downloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleQuickExcelExport}
              disabled={exportingExcel}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-60"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportingExcel ? 'Exporting...' : 'Export to Excel'}</span>
            </button>

            {/* Edit / Re-run */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/stepper')}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
                title="Edit business answers"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Info</span>
              </button>

              <button
                onClick={handleRunAnalysis}
                disabled={runningAnalysis}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Re-run AI analysis"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Re-Analyze</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Banner for Beginners: Exactly what to do next */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>What Should You Do Next?</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-normal">Beginner Guide</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              1. Check your priority tasks in <strong>"What To Do Next"</strong> below. &nbsp;•&nbsp; 
              2. Click <strong>"Ask AI How"</strong> on any task for step-by-step guidance. &nbsp;•&nbsp; 
              3. Download your <strong>PDF report</strong> to review or share.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/chat')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 shrink-0 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Advisor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* COMPLETE ANALYTIC REPORT TABS */}
      <div className="space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>Your Complete Business Analysis Report</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click the tabs below to explore your action plan, strengths, growth ideas, and full executive report.
            </p>
          </div>

          {/* Interactive Report View Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            {[
              { id: 'actions' as const, label: '🎯 What To Do Next', badge: actionItems.length },
              { id: 'proscons' as const, label: '⚖️ Pros & Cons', badge: (latestAnalysis?.prosAndCons.pros.length || 0) + (latestAnalysis?.prosAndCons.cons.length || 0) },
              { id: 'growth' as const, label: '💡 Growth Ideas', badge: latestAnalysis?.growthOpportunities.length || 0 },
              { id: 'swot' as const, label: '🔍 SWOT Analysis' },
              { id: 'overview' as const, label: '📄 Executive Summary' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeReportTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeReportTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: WHAT TO DO NEXT (ACTION ROADMAP) */}
        {activeReportTab === 'actions' && (
          <div className="space-y-4">
            {/* Task Progress & Filter Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Execution Roadmap:</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {completedTasks} of {totalTasks} Tasks Done ({taskProgress}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </div>

              {/* Timeframe Filters */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all' as const, label: 'All Tasks' },
                  { id: '7_days' as const, label: '⚡ Next 7 Days' },
                  { id: '30_days' as const, label: '📅 30 Days' },
                  { id: '90_days' as const, label: '🚀 90 Days' }
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setTaskFilter(tf.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      taskFilter === tf.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Checklist Items */}
            <div className="space-y-3">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, idx) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id || idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Interactive Checkbox */}
                        <button
                          onClick={() => handleToggleTask(task)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'bg-slate-950 border-slate-700 hover:border-blue-400 text-transparent'
                          }`}
                          title={isDone ? 'Mark as to-do' : 'Mark as done'}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <h4
                              className={`text-sm font-bold ${
                                isDone ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              Step {idx + 1}: {task.title}
                            </h4>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                                {task.timeframe.replace('_', ' ')}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  task.priority === 'urgent'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {task.priority.toUpperCase()} PRIORITY
                              </span>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Action helper button */}
                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                            <button
                              onClick={() => handleAskAIAboutTask(task.title)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 text-[11px] font-semibold border border-blue-500/30 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Ask AI How to Do This Task</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            {task.successMetric && (
                              <span className="text-[11px] text-slate-400">
                                Target result: <strong className="text-slate-300">{task.successMetric}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <p className="text-xs">No tasks found for this timeframe.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Want to create a custom task or track deadlines?
              </span>
              <button
                onClick={() => navigate('/actions')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>Open Full Task Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PROS & CONS (WHAT'S WORKING VS WHAT NEEDS FIXING) */}
        {activeReportTab === 'proscons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pros */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-500/30">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>5 Strengths (What Is Working Well)</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {latestAnalysis?.prosAndCons.pros.length || 0} Strengths
                </span>
              </div>

              <div className="space-y-3">
                {latestAnalysis?.prosAndCons.pros.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span> {item.point}
                      </h4>
                      {item.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                  </div>
                )) || <p className="text-xs text-slate-400 italic">No pros recorded yet.</p>}
              </div>
            </div>

            {/* Cons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-rose-500/30">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Things to Fix (Weaknesses & Bottlenecks)</span>
                </h3>
                <span className="text-[10px] text-rose-400 font-mono">
                  {latestAnalysis?.prosAndCons.cons.length || 0} Issues
                </span>
              </div>

              <div className="space-y-3">
                {latestAnalysis?.prosAndCons.cons.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-rose-400">⚠</span> {item.point}
                      </h4>
                      {item.impact && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                          {item.impact} Impact
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                  </div>
                )) || <p className="text-xs text-slate-400 italic">No cons recorded yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GROWTH OPPORTUNITIES */}
        {activeReportTab === 'growth' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestAnalysis?.growthOpportunities.map((opp, idx) => (
                <div
                  key={opp.id || idx}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Priority #{idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-400">{opp.expectedTimeToImplement || '1-2 weeks'}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{opp.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{opp.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Business Impact:</span>
                      <strong className="text-emerald-400">{opp.businessImpact} Impact</strong>
                    </div>
                    {opp.estimatedCostRange && (
                      <div className="flex justify-between">
                        <span>Estimated Cost:</span>
                        <strong className="text-white">{opp.estimatedCostRange}</strong>
                      </div>
                    )}
                    <button
                      onClick={() => handleAskAIAboutTask(opp.title)}
                      className="w-full mt-2 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask AI How to Launch This</span>
                    </button>
                  </div>
                </div>
              )) || (
                <p className="text-xs text-slate-400 py-6 text-center md:col-span-3">
                  No growth opportunities generated yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COMPLETE SWOT ANALYSIS */}
        {activeReportTab === 'swot' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Strengths (Internal Advantages)
              </h3>
              <div className="space-y-2.5">
                {latestAnalysis?.swot.strengths.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <p className="text-xs font-bold text-white">{s.point}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{s.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Weaknesses (Internal Bottlenecks)
              </h3>
              <div className="space-y-2.5">
                {latestAnalysis?.swot.weaknesses.map((w, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <p className="text-xs font-bold text-white">{w.point}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{w.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Compass className="w-4 h-4" />
                Opportunities (Market Potential)
              </h3>
              <div className="space-y-2.5">
                {latestAnalysis?.swot.opportunities.map((o, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <p className="text-xs font-bold text-white">{o.point}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{o.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Threats */}
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Threats (External Risks)
              </h3>
              <div className="space-y-2.5">
                {latestAnalysis?.swot.threats.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <p className="text-xs font-bold text-white">{t.point}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{t.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXECUTIVE SUMMARY & NUMBERS */}
        {activeReportTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Full Executive Consulting Deliverable
                </h3>
                <button
                  onClick={handleQuickPdfDownload}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 16-Section PDF Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-blue-400 uppercase text-[11px]">Business Model Structure</h4>
                  <p className="text-slate-300">
                    <strong>Primary Value Generation:</strong> {latestAnalysis?.businessModelAnalysis.valueGeneration || activeBusiness.productsServices.mainOfferings}
                  </p>
                  <p className="text-slate-300">
                    <strong>Value Proposition:</strong> {activeBusiness.productsServices.usp}
                  </p>
                  <p className="text-slate-300">
                    <strong>Customer Target:</strong> {activeBusiness.targetAudience.idealCustomerProfile}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-emerald-400 uppercase text-[11px]">Financial & Cash Review</h4>
                  <p className="text-slate-300">
                    <strong>Revenue Bracket:</strong> {activeBusiness.financials.monthlyRevenue || activeBusiness.financials.annualRevenue}
                  </p>
                  <p className="text-slate-300">
                    <strong>Cash Flow Status:</strong> <span className="capitalize">{activeBusiness.financials.cashFlowSituation || 'Positive'}</span>
                  </p>
                  <p className="text-slate-300">
                    <strong>Pricing Assessment:</strong> {latestAnalysis?.financialReview.revenueModelAssessment || 'Standard direct model'}
                  </p>
                </div>
              </div>

              {latestAnalysis?.executiveSummary.mainFindings && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-white mb-2">Key Diagnostic Findings:</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                    {latestAnalysis.executiveSummary.mainFindings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instant AI Advisor Q&A Helper Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-blue-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Strategy Coach
            </span>
            <h3 className="text-base font-bold text-white">
              Not sure which step to take first? Ask your AI Advisor.
            </h3>
            <p className="text-xs text-slate-400">
              Click any question below to get instant personalized advice tailored to {activeBusiness.identity.businessName}.
            </p>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 shrink-0 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <span>Open AI Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Clickable Question Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            `How can I get 5 new customers this month for ${activeBusiness.identity.businessName}?`,
            `How should I increase my prices without losing clients?`,
            `What is the best way to fix my biggest problem (${activeBusiness.challenges.biggestProblems[0] || 'slow sales'})?`,
            `Give me a simple 7-day checklist to boost profits.`
          ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => navigate('/chat', { state: { prompt: promptText } })}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-800 hover:border-blue-500/40 flex items-center gap-1.5 transition-all text-left"
            >
              <span>💬 {promptText}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
