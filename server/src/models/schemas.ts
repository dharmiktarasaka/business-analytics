import mongoose, { Schema } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, default: '' },
  displayName: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  yearlyRevenue: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Business Profile Schema
const BusinessProfileSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  isDraft: { type: Boolean, default: true },
  currentStep: { type: Number, default: 1 },
  completionPercentage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  identity: {
    businessName: { type: String, required: true },
    industry: { type: String, required: true },
    subIndustry: { type: String },
    description: { type: String, default: '' },
    websiteUrl: { type: String },
    country: { type: String, required: true },
    city: { type: String },
    targetMarkets: [{ type: String }],
    businessModel: { type: String, default: 'b2b' },
    businessStage: { type: String, default: 'startup' },
    yearEstablished: { type: Number },
    numberOfEmployees: { type: String },
    ownershipStructure: { type: String }
  },

  productsServices: {
    mainOfferings: { type: String, default: '' },
    descriptions: { type: String },
    pricingModel: { type: String, default: 'Fixed' },
    avgSellingPrice: { type: String },
    primaryRevenueGenerator: { type: String },
    usp: { type: String, default: '' },
    competitiveAdvantages: [{ type: String }],
    customerProblemsSolved: { type: String, default: '' },
    profitabilityObservations: { type: String }
  },

  targetAudience: {
    idealCustomerProfile: { type: String, default: '' },
    demographics: { type: String },
    segments: [{ type: String }],
    customerLocations: { type: String },
    painPoints: [{ type: String }],
    buyingBehavior: { type: String },
    estimatedCac: { type: String },
    estimatedLtv: { type: String },
    retentionBehavior: { type: String }
  },

  salesMarketing: {
    primaryChannels: [{ type: String }],
    websiteAndSeo: { type: String },
    paidAdvertising: { type: String },
    socialMediaPresence: { type: String },
    leadGenMethods: [{ type: String }],
    salesFunnelAndConversion: { type: String },
    monthlyLeadsAndConversions: { type: String },
    salesCycleLength: { type: String },
    salesTeamStructure: { type: String },
    monthlyMarketingBudget: { type: String },
    marketingChallenges: [{ type: String }]
  },

  financials: {
    monthlyRevenue: { type: String },
    annualRevenue: { type: String },
    operatingExpenses: { type: String },
    approximateProfitMargin: { type: String },
    cashFlowSituation: { type: String, default: 'unknown' },
    pricingAndMarginsNotes: { type: String },
    outstandingDebt: { type: String },
    majorOperatingCosts: { type: String },
    financialGoals: { type: String }
  },

  operations: {
    teamStructure: { type: String },
    keyProcesses: { type: String },
    toolsAndSoftware: [{ type: String }],
    operationalBottlenecks: [{ type: String }],
    automationOpportunities: { type: String },
    supplierDependencies: { type: String },
    fulfillmentProcess: { type: String },
    productivityChallenges: { type: String }
  },

  competition: {
    mainCompetitors: [{ type: String }],
    competitorUrls: [{ type: String }],
    differentiators: { type: String },
    marketOpportunities: [{ type: String }],
    knownIndustryTrends: { type: String },
    barriersToEntry: { type: String },
    customerAlternatives: { type: String }
  },

  challenges: {
    biggestProblems: [{ type: String }],
    shortTermGoals30To90Days: [{ type: String }],
    longTermGoals1To3Years: [{ type: String }],
    revenueGrowthTargets: { type: String },
    expansionPlans: { type: String },
    desiredCustomerSegments: { type: String },
    biggestRisks: [{ type: String }],
    aiAdvisorFocusAreas: [{ type: String }]
  }
});

// Business Analysis Schema
const BusinessAnalysisSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending', index: true },
  currentStage: { type: String, default: 'Reading your business answers' },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  modelUsed: { type: String, default: 'gemini-3.5-flash' },
  promptVersion: { type: String, default: 'v2.1-executive' },

  executiveSummary: { type: Schema.Types.Mixed },
  businessModelAnalysis: { type: Schema.Types.Mixed },
  swot: { type: Schema.Types.Mixed },
  prosAndCons: { type: Schema.Types.Mixed },
  marketingSalesAudit: { type: Schema.Types.Mixed },
  financialReview: { type: Schema.Types.Mixed },
  operationsProductivity: { type: Schema.Types.Mixed },
  competitivePositioning: { type: Schema.Types.Mixed },
  riskAnalysis: { type: Schema.Types.Mixed },
  growthOpportunities: { type: Schema.Types.Mixed },
  actionPlan: { type: Schema.Types.Mixed },
  informationGaps: { type: Schema.Types.Mixed }
});

// Conversation Schema
const ConversationSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now }
});

// Chat Message Schema
const ChatMessageSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  conversationId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  sender: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [{ type: String }],
  actionItemCandidate: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// Report Schema
const ReportSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  analysisId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  version: { type: Number, default: 1 },
  businessName: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  executiveSummary: { type: String, default: '' },
  sections: { type: Schema.Types.Mixed }
});

// Action Item Schema
const ActionItemSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String },
  priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'], default: 'medium' },
  timeframe: { type: String, enum: ['7_days', '30_days', '90_days', 'long_term'], default: '30_days' },
  status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
  ownerRole: { type: String },
  successMetric: { type: String },
  dueDate: { type: String },
  source: { type: String, default: 'ai_action_plan' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// User Settings Schema
const UserSettingsSchema = new Schema({
  ownerId: { type: String, required: true, unique: true, index: true },
  notificationsEnabled: { type: Boolean, default: true },
  emailReports: { type: Boolean, default: false },
  theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
  preferredCurrency: { type: String, default: 'USD' },
  aiCreativity: { type: String, enum: ['conservative', 'balanced', 'creative'], default: 'balanced' },
  geminiApiKey: { type: String },
  geminiModel: { type: String, default: 'gemini-1.5-flash' },
  updatedAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const BusinessProfileModel = mongoose.models.BusinessProfile || mongoose.model('BusinessProfile', BusinessProfileSchema);
export const BusinessAnalysisModel = mongoose.models.BusinessAnalysis || mongoose.model('BusinessAnalysis', BusinessAnalysisSchema);
export const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
export const ReportModel = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export const ActionItemModel = mongoose.models.ActionItem || mongoose.model('ActionItem', ActionItemSchema);
export const UserSettingsModel = mongoose.models.UserSettings || mongoose.model('UserSettings', UserSettingsSchema);
