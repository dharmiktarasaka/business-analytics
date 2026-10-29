import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import { api } from '../services/api.js';
import { exportReportToPDF } from '../services/pdfExport.js';
import { exportAnalysisToExcel } from '../services/excelExport.js';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Calendar,
  Sparkles,
  Building,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activeBusiness, latestAnalysis, reports, actionItems, refreshAll } = useBusiness();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!activeBusiness) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <FileText className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Select an Enterprise</h2>
        <p className="text-xs text-slate-400">Select an enterprise to view its consulting reports library.</p>
      </div>
    );
  }

  const handleGenerateReport = async () => {
    if (!latestAnalysis) {
      setNotice('A completed Business Diagnostic is required before generating an executive report.');
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    setGenerating(true);
    try {
      const created = await api.generateReport(latestAnalysis.id);
      await refreshAll();
      navigate(`/reports/${created.id}`);
    } catch (err) {
      setNotice((err as Error).message);
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            Download Reports
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Business Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Download easy-to-read PDF reports and Excel sheets to share with your team or review anytime.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {generating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Report...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Create New Report</span>
            </>
          )}
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button
            onClick={() => navigate('/stepper')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Start Diagnostic
          </button>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
            <p>No reports generated yet for {activeBusiness.identity.businessName}.</p>
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Generate Initial Report Version</span>
            </button>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                    VERSION {report.version}.0
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{report.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {report.executiveSummary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Report</span>
                </button>

                <button
                  onClick={() => {
                    if (latestAnalysis) {
                      exportReportToPDF(report, activeBusiness, latestAnalysis);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => {
                    if (latestAnalysis) {
                      exportAnalysisToExcel(activeBusiness, latestAnalysis, actionItems);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
