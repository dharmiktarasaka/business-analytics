export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  mobileNumber?: string;
  yearlyRevenue?: string;
  photoURL?: string;
}

export type BusinessModel = 'b2b' | 'b2c' | 'd2c' | 'marketplace' | 'service' | 'subscription' | 'hybrid';
export type BusinessStage = 'idea' | 'startup' | 'growing' | 'established' | 'scaling';
export type CashFlowSituation = 'positive' | 'tight' | 'negative' | 'variable' | 'unknown';

export interface IBusinessProfile {
  id: string;
  ownerId: string;
  isDraft: boolean;
  currentStep: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;

  identity: {
    businessName: string;
    industry: string;
    subIndustry?: string;
    description: string;
    websiteUrl?: string;
    country: string;
    city?: string;
    targetMarkets: string[];
    businessModel: BusinessModel;
    businessStage: BusinessStage;
    yearEstablished?: number;
    numberOfEmployees?: string;
    ownershipStructure?: string;
  };

  productsServices: {
    mainOfferings: string;
    descriptions?: string;
    pricingModel: string;
    avgSellingPrice?: string;
    primaryRevenueGenerator?: string;
    usp: string;
    competitiveAdvantages: string[];
    customerProblemsSolved: string;
    profitabilityObservations?: string;
  };

  targetAudience: {
    idealCustomerProfile: string;
    demographics?: string;
    segments: string[];
    customerLocations?: string;
    painPoints: string[];
    buyingBehavior?: string;
    estimatedCac?: string;
    estimatedLtv?: string;
    retentionBehavior?: string;
  };

  salesMarketing: {
    primaryChannels: string[];
    websiteAndSeo?: string;
    paidAdvertising?: string;
    socialMediaPresence?: string;
    leadGenMethods: string[];
    salesFunnelAndConversion?: string;
    monthlyLeadsAndConversions?: string;
    salesCycleLength?: string;
    salesTeamStructure?: string;
    monthlyMarketingBudget?: string;
    marketingChallenges: string[];
  };

  financials: {
    monthlyRevenue?: string;
    annualRevenue?: string;
    operatingExpenses?: string;
    approximateProfitMargin?: string;
    cashFlowSituation?: CashFlowSituation;
    pricingAndMarginsNotes?: string;
    outstandingDebt?: string;
    majorOperatingCosts?: string;
    financialGoals?: string;
  };

  operations: {
    teamStructure?: string;
    keyProcesses?: string;
    toolsAndSoftware: string[];
    operationalBottlenecks: string[];
    automationOpportunities?: string;
    supplierDependencies?: string;
    fulfillmentProcess?: string;
    productivityChallenges?: string;
  };

  competition: {
    mainCompetitors: string[];
    competitorUrls?: string[];
    differentiators?: string;
    marketOpportunities: string[];
    knownIndustryTrends?: string;
    barriersToEntry?: string;
    customerAlternatives?: string;
  };

  challenges: {
    biggestProblems: string[];
    shortTermGoals30To90Days: string[];
    longTermGoals1To3Years: string[];
    revenueGrowthTargets?: string;
    expansionPlans?: string;
    desiredCustomerSegments?: string;
    biggestRisks: string[];
    aiAdvisorFocusAreas: string[];
  };
}

export interface ISWOTItem {
  point: string;
  explanation: string;
  evidenceRef: string;
}

export interface IProConItem {
  point: string;
  detail: string;
  type: 'confirmed_fact' | 'ai_hypothesis';
  category?: 'Financial' | 'Operations' | 'Marketing' | 'Product' | 'Competition' | 'Team' | string;
  impact?: 'Critical' | 'High' | 'Moderate';
  evidenceRef?: string;
}

export interface IGrowthOpportunity {
  id: string;
  title: string;
  description: string;
  businessImpact: 'High' | 'Medium' | 'Low';
  implementationEffort: 'High' | 'Medium' | 'Low';
  estimatedCostRange?: string;
  expectedTimeToImplement: string;
  dependencies: string[];
  confidenceLevel: 'High' | 'Medium' | 'Low';
  recommendedPriority: number;
}

export interface IActionPlanItem {
  id: string;
  timeframe: '7_days' | '30_days' | '90_days' | '6_12_months';
  problemAddressed: string;
  recommendedAction: string;
  whyItMatters: string;
  implementationSteps: string[];
  priority: 'Urgent' | 'High' | 'Medium';
  suggestedOwnerRole: string;
  successMetric: string;
  dependenciesAndAssumptions?: string;
}

export interface IBusinessAnalysis {
  id: string;
  ownerId: string;
  businessId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStage: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
  modelUsed: string;
  promptVersion: string;

  executiveSummary: {
    overview: string;
    businessStage: string;
    mainFindings: string[];
    keyOpportunities: string[];
    priorityConcerns: string[];
  };

  businessModelAnalysis: {
    valueGeneration: string;
    revenueStreams: string[];
    customerValueProposition: string;
    modelStrengths: string[];
    modelWeaknesses: string[];
    diversificationOpportunities: string[];
  };

  swot: {
    strengths: ISWOTItem[];
    weaknesses: ISWOTItem[];
    opportunities: ISWOTItem[];
    threats: ISWOTItem[];
  };

  prosAndCons: {
    pros: IProConItem[];
    cons: IProConItem[];
  };

  marketingSalesAudit: {
    websiteConversionOpportunities: string[];
    seoAndSearchOpportunities: string[];
    leadGenerationWeaknesses: string[];
    advertisingEfficiency: string[];
    customerAcquisitionStrategy: string;
    salesFunnelImprovements: string[];
    brandPositioning: string;
    retentionAndReferral: string[];
  };

  financialReview: {
    revenueModelAssessment: string;
    costStructureObservations: string[];
    marginImprovementOpportunities: string[];
    cashFlowObservations: string;
    pricingConsiderations: string[];
    metricsRequiringAttention: string[];
    disclaimer: string;
  };

  operationsProductivity: {
    operationalBottlenecks: string[];
    processImprovements: string[];
    teamAndResourceGaps: string[];
    automationOpportunities: string[];
    technologyRecommendations: string[];
    estimatedSavingsSummary?: string;
  };

  competitivePositioning: {
    differentiationAssessment: string;
    competitorComparison: string;
    marketPositioningOpportunities: string[];
    competitiveThreats: string[];
    strengtheningValueProposition: string[];
    basisNotice: string;
  };

  riskAnalysis: {
    operationalRisks: string[];
    customerConcentrationRisks: string[];
    marketingDependencyRisks: string[];
    financialRisks: string[];
    technologySecurityRisks: string[];
    competitiveRisks: string[];
    mitigationMeasures: { risk: string; mitigation: string }[];
  };

  growthOpportunities: IGrowthOpportunity[];
  actionPlan: IActionPlanItem[];

  informationGaps: {
    missingInformation: string[];
    assumptionsMade: string[];
    lowConfidenceFindings: string[];
    recommendedQuestionsToImprove: string[];
  };
}

export interface IConversation {
  id: string;
  ownerId: string;
  businessId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface IChatMessage {
  id: string;
  ownerId: string;
  conversationId: string;
  businessId: string;
  sender: 'user' | 'assistant';
  content: string;
  sources?: string[];
  actionItemCandidate?: {
    title: string;
    description: string;
    timeframe: '7_days' | '30_days' | '90_days' | 'long_term';
    priority: 'urgent' | 'high' | 'medium' | 'low';
  };
  createdAt: string;
}

export interface IReport {
  id: string;
  ownerId: string;
  businessId: string;
  analysisId: string;
  title: string;
  version: number;
  businessName: string;
  generatedAt: string;
  executiveSummary: string;
  sections: {
    title: string;
    content: string;
    type?: 'text' | 'table' | 'cards' | 'list';
    data?: any;
  }[];
}

export interface IActionItem {
  id: string;
  ownerId: string;
  businessId: string;
  title: string;
  description: string;
  category?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  timeframe: '7_days' | '30_days' | '90_days' | 'long_term';
  status: 'todo' | 'in_progress' | 'completed';
  ownerRole?: string;
  successMetric?: string;
  dueDate?: string;
  source?: 'ai_action_plan' | 'ai_chat' | 'user_manual';
  createdAt: string;
  updatedAt: string;
}

export interface IUserSettings {
  ownerId: string;
  notificationsEnabled: boolean;
  emailReports: boolean;
  theme: 'dark' | 'light' | 'system';
  preferredCurrency: string;
  aiCreativity: 'conservative' | 'balanced' | 'creative';
  geminiApiKey?: string;
  geminiModel?: string;
  isGeminiConfigured?: boolean;
  updatedAt: string;
}

export interface IAdminUserDetail {
  uid: string;
  email: string;
  displayName: string;
  mobileNumber: string;
  yearlyRevenue: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  passwordMasked: string;
  passwordEncrypted: string;
  passwordAlgorithm: string;
  passwordStrength: 'Medium' | 'Strong' | 'Enterprise';
  passwordLength: number;
  businessName: string;
  businessId?: string | null;
  industry: string;
  country: string;
  businessModel: string;
  businessStage: string;
  completionPercentage: number;
  totalAnalyses: number;
  totalBusinesses: number;
}

export interface IAdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalAnalyses: number;
  todaySignups: number;
  revenueTiers: Record<string, number>;
  securityCompliance: string;
}

