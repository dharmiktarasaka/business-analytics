import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useBusiness } from '../context/BusinessContext.js';
import { exportReportToPDF } from '../services/pdfExport.js';
import { exportAnalysisToExcel } from '../services/excelExport.js';
import { IReport } from '../types/index.js';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  Calendar,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  Compass,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const ReportViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeBusiness, latestAnalysis, actionItems } = useBusiness();

  const [report, setReport] = useState<IReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        const data = await api.getReport(id);
        setReport(data);
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!report || !activeBusiness) {
    return (
      <div className="p-10 text-center text-slate-400">
        <p>Report not found or access denied.</p>
        <button
          onClick={() => navigate('/reports')}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Return to Reports Library
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (latestAnalysis) {
      exportReportToPDF(report, activeBusiness, latestAnalysis);
    }
  };

  const handleExportExcel = () => {
    if (latestAnalysis) {
      exportAnalysisToExcel(activeBusiness, latestAnalysis, actionItems);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print flex items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-transform active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Formal Document Container (Print friendly on clean white paper) */}
      <div className="report-surface bg-slate-950/90 border border-slate-800 rounded-3xl p-8 lg:p-14 space-y-10 shadow-2xl text-slate-200">
        {/* Cover Section */}
        <div className="border-b border-slate-800 pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              STRATIQ EXECUTIVE CONSULTING REPORT
            </span>
            <span className="text-xs font-mono text-slate-400">
              DOC-VER {report.version}.0
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {report.businessName} Strategic Advisory Report
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-500" />
              {activeBusiness.identity.industry} • {activeBusiness.identity.businessStage} Stage
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Date: {new Date(report.generatedAt).toLocaleDateString()}
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Board Verified
            </span>
          </div>
        </div>

        {/* 16 Consulting Sections */}
        <div className="space-y-8">
          {report.sections.map((section, idx) => (
            <div key={idx} className="space-y-3 pt-4 border-t border-slate-800/60 first:border-t-0 first:pt-0">
              <h2 className="text-base font-bold text-white tracking-tight">
                {section.title}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>

              {/* Render dynamic sub-data if present */}
              {section.data && typeof section.data === 'object' && (
                <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
                  {Object.entries(section.data).map(([k, val]: [string, any]) => {
                    if (Array.isArray(val)) {
                      return (
                        <div key={k} className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-blue-400 font-mono">
                            {k.replace(/([A-Z])/g, ' $1')}:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                            {val.map((item, i) => (
                              <li key={i}>{typeof item === 'string' ? item : item.point || item.title || item.recommendedAction || JSON.stringify(item)}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    if (typeof val === 'string') {
                      return (
                        <div key={k}>
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                            {k.replace(/([A-Z])/g, ' $1')}:{' '}
                          </span>
                          <span className="text-slate-300">{val}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Formal Report Sign-off Footer */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>Prepared by STRATIQ AI Business Intelligence Architecture</span>
          <span>Confidential & Proprietary • {report.businessName}</span>
        </div>
      </div>
    </div>
  );
};
