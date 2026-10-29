import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IReport, IBusinessAnalysis, IBusinessProfile } from '../types/index.js';

export function exportReportToPDF(report: IReport, profile: IBusinessProfile, analysis: IBusinessAnalysis) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 24;

  // Header background banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('EXECUTIVE STRATEGIC ADVISORY REPORT', margin, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${report.businessName} • Version ${report.version}.0 • Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, margin, 27);

  // Decorative Accent line
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(0, 41, pageWidth, 2, 'F');

  currentY = 52;

  // Executive Summary Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Summary', margin, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  const summaryLines = doc.splitTextToSize(report.executiveSummary, contentWidth);
  doc.text(summaryLines, margin, currentY);
  currentY += summaryLines.length * 5 + 8;

  // Key Findings Callout Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Top Strategic Mandate:', margin + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const mandateText = analysis.actionPlan[0]?.recommendedAction || 'Execute primary pipeline optimization to eliminate revenue leakage.';
  const mandateLines = doc.splitTextToSize(mandateText, contentWidth - 8);
  doc.text(mandateLines, margin + 4, currentY + 14);

  currentY += 34;

  // 2. SWOT Analysis Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Comprehensive SWOT Matrix', margin, currentY);
  currentY += 6;

  const swotRows: string[][] = [];
  const maxSwotItems = Math.max(
    analysis.swot.strengths.length,
    analysis.swot.weaknesses.length,
    analysis.swot.opportunities.length,
    analysis.swot.threats.length
  );

  for (let i = 0; i < maxSwotItems; i++) {
    swotRows.push([
      analysis.swot.strengths[i] ? `${analysis.swot.strengths[i].point}\n(${analysis.swot.strengths[i].evidenceRef})` : '-',
      analysis.swot.weaknesses[i] ? `${analysis.swot.weaknesses[i].point}\n(${analysis.swot.weaknesses[i].evidenceRef})` : '-',
      analysis.swot.opportunities[i] ? `${analysis.swot.opportunities[i].point}\n(${analysis.swot.opportunities[i].evidenceRef})` : '-',
      analysis.swot.threats[i] ? `${analysis.swot.threats[i].point}\n(${analysis.swot.threats[i].evidenceRef})` : '-'
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Strengths (Internal)', 'Weaknesses (Internal)', 'Opportunities (External)', 'Threats (External)']],
    body: swotRows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 4 },
      1: { cellWidth: contentWidth / 4 },
      2: { cellWidth: contentWidth / 4 },
      3: { cellWidth: contentWidth / 4 }
    }
  });

  // Page 2: Action Plan & Growth Opportunities
  doc.addPage();
  currentY = 24;

  // Running Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${report.businessName} • Strategic Action Plan & Growth Roadmap`, margin, 14);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 17, pageWidth - margin, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Ranked Growth Opportunities', margin, currentY);
  currentY += 6;

  const oppRows = analysis.growthOpportunities.map((opp) => [
    `#${opp.recommendedPriority} ${opp.title}`,
    opp.businessImpact,
    opp.implementationEffort,
    opp.expectedTimeToImplement,
    opp.confidenceLevel
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Initiative', 'Impact', 'Effort', 'Timeframe', 'Confidence']],
    body: oppRows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [16, 185, 129], // emerald
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: [51, 65, 85]
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Action Roadmap Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Timeframe Action Roadmap (7d / 30d / 90d)', margin, currentY);
  currentY += 6;

  const actionRows = analysis.actionPlan.map((act) => [
    act.timeframe.replace('_', ' ').toUpperCase(),
    act.priority,
    act.recommendedAction,
    act.suggestedOwnerRole,
    act.successMetric
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Timeframe', 'Priority', 'Action Directive', 'Owner', 'Success Metric']],
    body: actionRows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [37, 99, 235], // blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 18 },
      2: { cellWidth: 65 },
      3: { cellWidth: 32 },
      4: { cellWidth: 35 }
    }
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Confidential • Prepared for ${report.businessName} • AI Business Intelligence System`, margin, pageHeight - 8);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 8);
  }

  // Trigger download
  const filename = `${profile.identity.businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Strategic_Report_v${report.version}.pdf`;
  doc.save(filename);
}
