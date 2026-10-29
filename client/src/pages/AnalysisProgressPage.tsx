import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useBusiness } from '../context/BusinessContext.js';
import { IBusinessAnalysis } from '../types/index.js';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Compass,
  TrendingUp,
  MessageSquare,
  FileText,
  ShieldAlert,
  Loader2,
  Zap,
  Activity,
  Layers,
  Check
} from 'lucide-react';

interface StageDefinition {
  id: number;
  title: string;
  shortDesc: string;
  thinkingNote: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WORKFLOW_STAGES: StageDefinition[] = [
  {
    id: 1,
    title: 'Reading your business answers',
    shortDesc: 'Parsing your industry, offerings, and target customer answers',
    thinkingNote: 'Reviewing your business structure, products, and target audience...',
    icon: FileText
  },
  {
    id: 2,
    title: 'Evaluating your business model',
    shortDesc: 'Analyzing how your business generates revenue and creates value',
    thinkingNote: 'Calculating pricing feasibility and profit stream diversity...',
    icon: Compass
  },
  {
    id: 3,
    title: 'Finding your strengths & weaknesses',
    shortDesc: 'Pinpointing unique advantages and operational bottlenecks',
    thinkingNote: 'Comparing competitive differentiators and identifying friction points...',
    icon: Sparkles
  },
  {
    id: 4,
    title: 'Discovering growth opportunities',
    shortDesc: 'Uncovering practical ideas to increase sales, reach, and margins',
    thinkingNote: 'Analyzing marketing channels, partnerships, and high-margin levers...',
    icon: TrendingUp
  },
  {
    id: 5,
    title: 'Analyzing bottlenecks & risks',
    shortDesc: 'Checking cash flow vulnerabilities, client dependency, and risks',
    thinkingNote: 'Simulating worst-case dependencies and cost structure vulnerabilities...',
    icon: ShieldAlert
  },
  {
    id: 6,
    title: 'Creating your action roadmap',
    shortDesc: 'Formulating step-by-step priority tasks for immediate execution',
    thinkingNote: 'Sequencing high-ROI actions for 7-day, 30-day, and 90-day timeframes...',
    icon: Layers
  },
  {
    id: 7,
    title: 'Preparing executive summary & report',
    shortDesc: 'Finalizing your easy-to-read business report and SWOT summary',
    thinkingNote: 'Compiling your final executive report and interactive action plan...',
    icon: Sparkles
  }
];

const THINKING_MESSAGES = [
  'Examining your core business model & revenue streams...',
  'Evaluating your target audience fit and acquisition channels...',
  'Detecting highest-impact operational bottlenecks...',
  'Pinpointing high-ROI growth opportunities and quick wins...',
  'Structuring practical 7-day, 30-day, and 90-day action steps...',
  'Assembling your personalized executive summary & SWOT matrix...'
];

// Robust stage matching function that handles any variations from backend or history
function matchStageIndex(stageStr?: string, isCompleted?: boolean): number {
  if (isCompleted) return WORKFLOW_STAGES.length;
  if (!stageStr) return 0;
  const s = stageStr.toLowerCase();
  if (s.includes('completed') || s.includes('finished')) return WORKFLOW_STAGES.length;
  if (s.includes('reading') || s.includes('organizing') || s.includes('answer')) return 0;
  if (s.includes('model') || s.includes('evaluating business model')) return 1;
  if (s.includes('strength') || s.includes('weakness') || s.includes('assessing')) return 2;
  if (s.includes('growth') || s.includes('opportunity') || s.includes('identifying')) return 3;
  if (s.includes('risk') || s.includes('bottleneck') || s.includes('problem')) return 4;
  if (s.includes('roadmap') || s.includes('recommendation') || s.includes('action') || s.includes('step')) return 5;
  if (s.includes('report') || s.includes('summary') || s.includes('generating') || s.includes('preparing')) return 6;
  return 0;
}

const TOTAL_STAGES = 7;
const BASELINE_TOTAL_SECONDS = 48; // Baseline estimated duration across 7 diagnostic steps
const SECONDS_PER_STAGE = BASELINE_TOTAL_SECONDS / TOTAL_STAGES; // ~6.85s per step evenly divided

export const AnalysisProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshAll } = useBusiness();

  const [analysis, setAnalysis] = useState<IBusinessAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buffering & Progress animation state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressPercent, setProgressPercent] = useState(2);
  const [thoughtIndex, setThoughtIndex] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const hasRefreshedRef = useRef(false);

  // Live timer & smooth evenly-paced progress effect
  useEffect(() => {
    if (analysis?.status === 'completed' || analysis?.status === 'failed') return;

    // Elapsed seconds timer (1s interval)
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Thought snippet rotator (every 3.2s)
    const thoughtInterval = setInterval(() => {
      setThoughtIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 3200);

    // Smooth percentage progress ticker (every 200ms)
    // Divides the whole analyzing time evenly across all 7 steps (~1.95% per second)
    // and continues crawling smoothly towards 99% if analysis runs longer, NEVER getting stuck!
    const progressInterval = setInterval(() => {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      let target: number;

      if (elapsedSec <= BASELINE_TOTAL_SECONDS) {
        // Divided evenly across the 48-second baseline up to 94% (~1.95% per second)
        target = Math.max(2, Math.min(94, Math.floor((elapsedSec / BASELINE_TOTAL_SECONDS) * 94)));
      } else {
        // Overtime: NEVER get stuck at 94%!
        // Continuously and smoothly crawl: 95% -> 96% -> 97% -> 98% -> 99%
        const overtime = elapsedSec - BASELINE_TOTAL_SECONDS;
        const extra = Math.min(5, Math.floor(overtime / 9)); // +1% every 9 seconds
        target = Math.min(99, 94 + extra);
      }

      setProgressPercent((prev) => Math.max(prev, target));
    }, 200);

    return () => {
      clearInterval(timerInterval);
      clearInterval(thoughtInterval);
      clearInterval(progressInterval);
    };
  }, [analysis?.status]);

  // Fetch and poll analysis status from API
  useEffect(() => {
    if (!id) return;

    let isSubscribed = true;
    let pollInterval: any = null;

    const fetchAnalysis = async () => {
      try {
        const data = await api.getAnalysis(id);
        if (isSubscribed) {
          setAnalysis(data);
          setLoading(false);

          if (data.status === 'completed') {
            setProgressPercent(100);
            if (pollInterval) clearInterval(pollInterval);
            if (!hasRefreshedRef.current) {
              hasRefreshedRef.current = true;
              refreshAll();
            }
          } else if (data.status === 'failed') {
            if (pollInterval) clearInterval(pollInterval);
            setError(data.error || 'Diagnostic run encountered an issue.');
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setError((err as Error).message);
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      }
    };

    fetchAnalysis();
    pollInterval = setInterval(fetchAnalysis, 1200);

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, refreshAll]);

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    setError(null);
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    setProgressPercent(2);
    try {
      const restarted = await api.retryAnalysis(id);
      setAnalysis(restarted);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRetrying(false);
    }
  };

  if (loading && !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-sm font-medium text-slate-300">Connecting to AI Analysis Core...</p>
      </div>
    );
  }

  const isCompleted = analysis?.status === 'completed';
  const isFailed = analysis?.status === 'failed';
  const serverStageIndex = matchStageIndex(analysis?.currentStage, isCompleted);
  // Time-based stage evenly divides the whole analyzing time across all 7 steps (~6.85s per step)
  const timeBasedStageIndex = isCompleted
    ? WORKFLOW_STAGES.length
    : Math.min(6, Math.floor(elapsedSeconds / SECONDS_PER_STAGE));
  const activeStageIndex = isCompleted
    ? WORKFLOW_STAGES.length
    : Math.max(serverStageIndex, timeBasedStageIndex);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PROCESSING STATUS CARD                                    */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-blue-950/40 border border-slate-800 p-6 lg:p-8 rounded-3xl relative overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Visual Processing Orb / Icon */}
            {!isCompleted && !isFailed ? (
              <div className="relative flex items-center justify-center w-16 h-16 shrink-0 mt-0.5">
                {/* Ping wave */}
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
                {/* Rotating gradient border ring */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 opacity-75 blur-xs animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-slate-950 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              </div>
            ) : isCompleted ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20 shrink-0">
                <AlertCircle className="w-9 h-9" />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {!isCompleted && !isFailed && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 border border-blue-500/40 text-blue-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping inline-block" />
                    AI Buffering & Calculating
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                )}
                {analysis?.modelUsed && (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    Gemini 3.5 AI
                  </span>
                )}
              </div>

              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                {isCompleted
                  ? 'Your Business Diagnostic is Ready!'
                  : isFailed
                  ? 'Analysis Encountered an Issue'
                  : 'AI Advisor is Reviewing Your Business Answers'}
              </h1>

              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {isCompleted
                  ? 'We analyzed your business answers, detected bottlenecks, and generated your customized action plan.'
                  : isFailed
                  ? 'The AI analysis was interrupted. You can restart it with one click below.'
                  : 'Please wait a moment while Gemini AI thoroughly evaluates your business model, customer fit, and growth opportunities.'}
              </p>
            </div>
          </div>

          {/* Right Status Badge / CTA */}
          <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6 space-y-2">
            {!isCompleted && !isFailed && (
              <>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Elapsed: <strong className="text-white">{elapsedSeconds}s</strong></span>
                  <span className="text-slate-600">•</span>
                  {BASELINE_TOTAL_SECONDS > elapsedSeconds ? (
                    <span>Est: <strong className="text-slate-300">~{BASELINE_TOTAL_SECONDS - elapsedSeconds}s</strong></span>
                  ) : (
                    <span className="text-cyan-400 animate-pulse font-medium">Finalizing analysis...</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-blue-400 font-mono tracking-tight">
                    {progressPercent}%
                  </span>
                </div>
              </>
            )}

            {isCompleted && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>View Full Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Animated Progress Bar */}
        {!isCompleted && !isFailed && (
          <div className="mt-6 space-y-2">
            <div className="w-full bg-slate-950/80 rounded-full h-2.5 p-0.5 border border-slate-800/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Moving shimmer stripe effect */}
                <div className="absolute inset-0 bg-white/25 animate-pulse" />
              </div>
            </div>

            {/* Live Thinking Insight Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>
                  {progressPercent >= 94
                    ? 'Finalizing executive summary & deep strategic roadmap...'
                    : (WORKFLOW_STAGES[activeStageIndex]?.thinkingNote || THINKING_MESSAGES[thoughtIndex])}
                </span>
              </span>
              <span className="text-slate-500 font-mono hidden sm:inline">
                Step {Math.min(activeStageIndex + 1, 7)} of 7
              </span>
            </div>
          </div>
        )}

        {/* Failure Retry Action */}
        {isFailed && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error || 'Something went wrong during analysis.'}</span>
            </div>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              <RotateCcw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Retrying...' : 'Restart Analysis'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LIVE ANALYSIS WORKFLOW STEPS WITH ACTIVE BUFFERING EFFECTS              */}
      {/* ========================================================================= */}
      {!isCompleted && !isFailed && (
        <div className="bg-slate-900/60 border border-slate-800 p-6 lg:p-8 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Processing Steps
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Real-time Gemini Diagnostic
            </span>
          </div>

          <div className="space-y-3">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isDone = activeStageIndex > idx;
              const isCurrent = activeStageIndex === idx;
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/50 border-blue-500/50 text-white shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/30'
                      : isDone
                      ? 'bg-slate-950/60 border-slate-800/80 text-emerald-400'
                      : 'bg-slate-950/20 border-slate-900/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Step Indicator Icon */}
                      <div className="mt-0.5">
                        {isDone ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : isCurrent ? (
                          <div className="relative w-6 h-6 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                            <div className="relative w-6 h-6 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-300">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Step Title & Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isCurrent ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                            Step {stage.id}: {stage.title}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-blue-200' : isDone ? 'text-slate-400' : 'text-slate-600'}`}>
                          {isCurrent ? stage.thinkingNote : stage.shortDesc}
                        </p>
                      </div>
                    </div>

                    {/* Step Status Pill */}
                    <div className="shrink-0">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-blue-500/20 border border-blue-400/50 text-blue-300 shadow-xs shadow-blue-500/20">
                          <span className="flex space-x-1">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          <span>Analyzing</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-900 border border-slate-800/80 text-slate-600">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Micro sub-progress bar for active step */}
                  {isCurrent && (
                    <div className="mt-3 pt-3 border-t border-blue-500/20 flex items-center justify-between text-[10px] text-blue-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                        <span>AI reasoning in progress for this question set...</span>
                      </span>
                      <span className="font-mono text-cyan-400 animate-pulse font-semibold">Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Friendly explanatory banner */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-slate-300">
              <span className="font-semibold text-blue-300">Why does this take a few moments?</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gemini AI is reading every answer you gave, cross-referencing industry benchmarks, finding hidden revenue opportunities, and creating an actionable checklist tailored specifically to your business.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPLETED RESULTS SHOWCASE & IMMEDIATE NAVIGATION                       */}
      {/* ========================================================================= */}
      {isCompleted && analysis && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-slate-900/70 border border-slate-800 p-6 lg:p-8 rounded-3xl space-y-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Comprehensive Analysis Complete
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Engine: {analysis.modelUsed || 'Gemini 3.5'}
                </span>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  <span>Open Full Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-2">Executive Overview of Your Business</h2>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                {analysis.executiveSummary.overview || 'Your diagnostic report has synthesized your business answers.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 space-y-2.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Top Growth Opportunities Found
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.executiveSummary.keyOpportunities.slice(0, 3).map((opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-2.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Priority Bottlenecks to Fix
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.executiveSummary.priorityConcerns.slice(0, 3).map((con, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-5 rounded-2xl bg-gradient-to-b from-blue-600/10 to-transparent border border-blue-500/20 hover:border-blue-500/50 text-left space-y-2 group transition-all hover:scale-[1.02]"
            >
              <Compass className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-white">Full Dashboard</h3>
              <p className="text-[11px] text-slate-400">See your complete analytics report, next steps, and task checklist.</p>
            </button>

            <button
              onClick={() => navigate('/swot')}
              className="p-5 rounded-2xl bg-gradient-to-b from-indigo-600/10 to-transparent border border-indigo-500/20 hover:border-indigo-500/50 text-left space-y-2 group transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-white">SWOT Analysis</h3>
              <p className="text-[11px] text-slate-400">Review strengths, weaknesses, opportunities, and market risks.</p>
            </button>

            <button
              onClick={() => navigate('/growth')}
              className="p-5 rounded-2xl bg-gradient-to-b from-emerald-600/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 text-left space-y-2 group transition-all hover:scale-[1.02]"
            >
              <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-white">Growth Roadmap</h3>
              <p className="text-[11px] text-slate-400">Explore prioritized ideas and high-impact revenue levers.</p>
            </button>

            <button
              onClick={() => navigate('/chat')}
              className="p-5 rounded-2xl bg-gradient-to-b from-violet-600/10 to-transparent border border-violet-500/20 hover:border-violet-500/50 text-left space-y-2 group transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-white">Ask AI Advisor</h3>
              <p className="text-[11px] text-slate-400">Chat directly with Gemini about your report or ask how to do any task.</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
