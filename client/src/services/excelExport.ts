import * as XLSX from 'xlsx';
import { IBusinessProfile, IBusinessAnalysis, IActionItem } from '../types/index.js';

export function exportAnalysisToExcel(profile: IBusinessProfile, analysis: IBusinessAnalysis, actions: IActionItem[] = []) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Overview
  const overviewData = [
    ['AI BUSINESS INTELLIGENCE & STRATEGY ADVISOR - EXECUTIVE REPORT'],
    ['Generated On', new Date().toISOString()],
    [''],
    ['BUSINESS IDENTITY'],
    ['Business Name', profile.identity.businessName],
    ['Industry', profile.identity.industry],
    ['Business Model', profile.identity.businessModel.toUpperCase()],
    ['Stage', profile.identity.businessStage],
    ['Country / Market', profile.identity.country],
    ['USP', profile.productsServices.usp],
    [''],
    ['FINANCIAL & OPERATIONAL BASELINE'],
    ['Monthly Revenue', profile.financials.monthlyRevenue || 'Not specified'],
    ['Profit Margin', profile.financials.approximateProfitMargin || 'Not specified'],
    ['Cash Flow Situation', profile.financials.cashFlowSituation || 'Unknown'],
    ['Primary Bottleneck', profile.operations.operationalBottlenecks.join(', ') || 'None specified'],
    [''],
    ['EXECUTIVE SUMMARY FINDINGS'],
    ['Overview', analysis.executiveSummary.overview],
    ...analysis.executiveSummary.mainFindings.map((f, i) => [`Finding #${i + 1}`, f]),
    [''],
    ['PRIORITY CONCERNS'],
    ...analysis.executiveSummary.priorityConcerns.map((c, i) => [`Concern #${i + 1}`, c])
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Executive Overview');

  // Sheet 2: SWOT Matrix
  const swotData = [
    ['CATEGORY', 'STRATEGIC FACTOR', 'EXPLANATION', 'EVIDENCE REFERENCE'],
    ...analysis.swot.strengths.map((s) => ['STRENGTH', s.point, s.explanation, s.evidenceRef]),
    ...analysis.swot.weaknesses.map((w) => ['WEAKNESS', w.point, w.explanation, w.evidenceRef]),
    ...analysis.swot.opportunities.map((o) => ['OPPORTUNITY', o.point, o.explanation, o.evidenceRef]),
    ...analysis.swot.threats.map((t) => ['THREAT', t.point, t.explanation, t.evidenceRef])
  ];
  const wsSwot = XLSX.utils.aoa_to_sheet(swotData);
  XLSX.utils.book_append_sheet(wb, wsSwot, 'SWOT Analysis');

  // Sheet 3: Growth Opportunities
  const oppData = [
    ['PRIORITY', 'INITIATIVE TITLE', 'DESCRIPTION', 'IMPACT', 'EFFORT', 'COST RANGE', 'TIMEFRAME', 'CONFIDENCE'],
    ...analysis.growthOpportunities.map((opp) => [
      opp.recommendedPriority,
      opp.title,
      opp.description,
      opp.businessImpact,
      opp.implementationEffort,
      opp.estimatedCostRange || '$0',
      opp.expectedTimeToImplement,
      opp.confidenceLevel
    ])
  ];
  const wsOpp = XLSX.utils.aoa_to_sheet(oppData);
  XLSX.utils.book_append_sheet(wb, wsOpp, 'Growth Opportunities');

  // Sheet 4: Action Roadmap
  const actionData = [
    ['TIMEFRAME', 'PRIORITY', 'RECOMMENDED ACTION', 'PROBLEM ADDRESSED', 'SUGGESTED OWNER', 'SUCCESS METRIC'],
    ...analysis.actionPlan.map((act) => [
      act.timeframe.replace('_', ' ').toUpperCase(),
      act.priority,
      act.recommendedAction,
      act.problemAddressed,
      act.suggestedOwnerRole,
      act.successMetric
    ])
  ];
  const wsActions = XLSX.utils.aoa_to_sheet(actionData);
  XLSX.utils.book_append_sheet(wb, wsActions, 'Action Roadmap');

  // Sheet 5: Real Pros & Cons Audit
  if (analysis.prosAndCons) {
    const prosConsData = [
      ['AUDIT TYPE', 'CATEGORY', 'FACTOR POINT', 'EXPLANATION & DETAIL', 'IMPACT LEVEL', 'EVIDENCE REFERENCE'],
      ...analysis.prosAndCons.pros.map((p) => [
        p.type === 'confirmed_fact' ? 'CONFIRMED ADVANTAGE' : 'PROS (AI DIAGNOSED)',
        p.category || 'General',
        p.point,
        p.detail,
        p.impact || 'High',
        p.evidenceRef || ''
      ]),
      ...analysis.prosAndCons.cons.map((c) => [
        c.type === 'confirmed_fact' ? 'CONFIRMED LIABILITY' : 'CONS (OPERATIONAL FRICTION)',
        c.category || 'General',
        c.point,
        c.detail,
        c.impact || 'Critical',
        c.evidenceRef || ''
      ])
    ];
    const wsProsCons = XLSX.utils.aoa_to_sheet(prosConsData);
    XLSX.utils.book_append_sheet(wb, wsProsCons, 'Pros & Cons Audit');
  }

  // Write file
  const filename = `${profile.identity.businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Strategy_Export.xlsx`;
  XLSX.writeFile(wb, filename);
}
