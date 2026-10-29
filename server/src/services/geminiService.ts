import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { IBusinessProfile, IBusinessAnalysis, IChatMessage } from '../types/index.js';

let genAI: GoogleGenerativeAI | null = null;
if (config.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    console.log(`✅ [Gemini Service] Initialized with model: ${config.geminiModel}`);
  } catch (err) {
    console.warn('⚠️ [Gemini Service] Failed to initialize Google Generative AI:', (err as Error).message);
  }
} else {
  console.log('ℹ️ [Gemini Service] GEMINI_API_KEY not configured. Intelligent rule-grounded analyzer fallback will be active.');
}

const ANALYSIS_PROMPT_VERSION = 'v3.0-executive-grounded';

function sanitizeProfile(p: Partial<IBusinessProfile>): IBusinessProfile {
  return {
    id: p.id || 'biz_default',
    ownerId: p.ownerId || 'owner_default',
    isDraft: p.isDraft !== undefined ? p.isDraft : true,
    currentStep: p.currentStep || 1,
    completionPercentage: p.completionPercentage || 0,
    createdAt: p.createdAt || new Date(),
    updatedAt: p.updatedAt || new Date(),
    identity: {
      businessName: p.identity?.businessName || 'Your Enterprise',
      industry: p.identity?.industry || 'Commercial Enterprise',
      subIndustry: p.identity?.subIndustry || '',
      description: p.identity?.description || '',
      websiteUrl: p.identity?.websiteUrl || '',
      country: p.identity?.country || 'United States',
      city: p.identity?.city || '',
      targetMarkets: p.identity?.targetMarkets || ['Domestic'],
      businessModel: p.identity?.businessModel || 'b2b',
      businessStage: p.identity?.businessStage || 'growing',
      yearEstablished: p.identity?.yearEstablished,
      numberOfEmployees: p.identity?.numberOfEmployees,
      ownershipStructure: p.identity?.ownershipStructure
    },
    productsServices: {
      mainOfferings: p.productsServices?.mainOfferings || 'Core Products and Services',
      descriptions: p.productsServices?.descriptions || '',
      pricingModel: p.productsServices?.pricingModel || 'Fixed',
      avgSellingPrice: p.productsServices?.avgSellingPrice || '',
      primaryRevenueGenerator: p.productsServices?.primaryRevenueGenerator || '',
      usp: p.productsServices?.usp || 'Differentiated market capability',
      competitiveAdvantages: p.productsServices?.competitiveAdvantages || [],
      customerProblemsSolved: p.productsServices?.customerProblemsSolved || 'Critical operational friction',
      profitabilityObservations: p.productsServices?.profitabilityObservations || ''
    },
    targetAudience: {
      idealCustomerProfile: p.targetAudience?.idealCustomerProfile || 'Target business accounts',
      demographics: p.targetAudience?.demographics || '',
      segments: p.targetAudience?.segments || [],
      customerLocations: p.targetAudience?.customerLocations || '',
      painPoints: p.targetAudience?.painPoints || ['Time and cost inefficiencies'],
      buyingBehavior: p.targetAudience?.buyingBehavior || '',
      estimatedCac: p.targetAudience?.estimatedCac || '',
      estimatedLtv: p.targetAudience?.estimatedLtv || '',
      retentionBehavior: p.targetAudience?.retentionBehavior || ''
    },
    salesMarketing: {
      primaryChannels: p.salesMarketing?.primaryChannels || ['Direct Outreach', 'Referrals'],
      websiteAndSeo: p.salesMarketing?.websiteAndSeo || '',
      paidAdvertising: p.salesMarketing?.paidAdvertising || '',
      socialMediaPresence: p.salesMarketing?.socialMediaPresence || '',
      leadGenMethods: p.salesMarketing?.leadGenMethods || [],
      salesFunnelAndConversion: p.salesMarketing?.salesFunnelAndConversion || '',
      monthlyLeadsAndConversions: p.salesMarketing?.monthlyLeadsAndConversions || '',
      salesCycleLength: p.salesMarketing?.salesCycleLength || '',
      salesTeamStructure: p.salesMarketing?.salesTeamStructure || '',
      monthlyMarketingBudget: p.salesMarketing?.monthlyMarketingBudget || '',
      marketingChallenges: p.salesMarketing?.marketingChallenges || []
    },
    financials: {
      monthlyRevenue: p.financials?.monthlyRevenue || '',
      annualRevenue: p.financials?.annualRevenue || '',
      operatingExpenses: p.financials?.operatingExpenses || '',
      approximateProfitMargin: p.financials?.approximateProfitMargin || '',
      cashFlowSituation: p.financials?.cashFlowSituation || 'unknown',
      pricingAndMarginsNotes: p.financials?.pricingAndMarginsNotes || '',
      outstandingDebt: p.financials?.outstandingDebt || '',
      majorOperatingCosts: p.financials?.majorOperatingCosts || '',
      financialGoals: p.financials?.financialGoals || ''
    },
    operations: {
      teamStructure: p.operations?.teamStructure || '',
      keyProcesses: p.operations?.keyProcesses || '',
      toolsAndSoftware: p.operations?.toolsAndSoftware || [],
      operationalBottlenecks: p.operations?.operationalBottlenecks || ['Workload and execution capacity'],
      automationOpportunities: p.operations?.automationOpportunities || '',
      supplierDependencies: p.operations?.supplierDependencies || '',
      fulfillmentProcess: p.operations?.fulfillmentProcess || '',
      productivityChallenges: p.operations?.productivityChallenges || ''
    },
    competition: {
      mainCompetitors: p.competition?.mainCompetitors || ['Traditional industry alternatives'],
      competitorUrls: p.competition?.competitorUrls || [],
      differentiators: p.competition?.differentiators || '',
      marketOpportunities: p.competition?.marketOpportunities || ['Market demand expansion'],
      knownIndustryTrends: p.competition?.knownIndustryTrends || '',
      barriersToEntry: p.competition?.barriersToEntry || '',
      customerAlternatives: p.competition?.customerAlternatives || ''
    },
    challenges: {
      biggestProblems: p.challenges?.biggestProblems || ['Pipeline predictability and execution scaling'],
      shortTermGoals30To90Days: p.challenges?.shortTermGoals30To90Days || ['Establish reliable growth milestones'],
      longTermGoals1To3Years: p.challenges?.longTermGoals1To3Years || ['Expand enterprise revenue scale'],
      revenueGrowthTargets: p.challenges?.revenueGrowthTargets || '',
      expansionPlans: p.challenges?.expansionPlans || '',
      desiredCustomerSegments: p.challenges?.desiredCustomerSegments || '',
      biggestRisks: p.challenges?.biggestRisks || ['Market competition and cost inflation'],
      aiAdvisorFocusAreas: p.challenges?.aiAdvisorFocusAreas || ['Growth strategy and workflow automation']
    }
  };
}

export function formatProfileForPrompt(raw: IBusinessProfile): string {
  const p = sanitizeProfile(raw);
  return `
===================================================================
COMPLETE BUSINESS DIAGNOSTIC QUESTIONNAIRE (ALL 9 DIMENSIONS)
===================================================================

[1. BUSINESS IDENTITY & CORPORATE STRUCTURE]
- Business Name: ${p.identity.businessName}
- Primary Industry: ${p.identity.industry}
- Sub-Industry / Niche: ${p.identity.subIndustry || 'General / Unspecified'}
- Business Model: ${p.identity.businessModel.toUpperCase()}
- Business Stage: ${p.identity.businessStage}
- Year Established: ${p.identity.yearEstablished || 'Not reported'}
- Number of Employees / Contractors: ${p.identity.numberOfEmployees || 'Not reported'}
- Ownership Structure: ${p.identity.ownershipStructure || 'Sole / Closely held'}
- Target Markets: ${p.identity.targetMarkets.join(', ')}
- Business Description: ${p.identity.description || 'None provided'}
- Website URL: ${p.identity.websiteUrl || 'None'}

[2. PRODUCTS, SERVICES & VALUE PROPOSITION]
- Main Offerings: ${p.productsServices.mainOfferings}
- Offering Descriptions: ${p.productsServices.descriptions || 'None provided'}
- Pricing Model: ${p.productsServices.pricingModel}
- Average Selling Price / Deal Size: ${p.productsServices.avgSellingPrice || 'Not specified'}
- Primary Revenue Generator: ${p.productsServices.primaryRevenueGenerator || p.productsServices.mainOfferings}
- Unique Selling Proposition (USP): ${p.productsServices.usp}
- Stated Competitive Advantages: ${p.productsServices.competitiveAdvantages.join(', ') || 'None reported'}
- Specific Customer Problems Solved: ${p.productsServices.customerProblemsSolved}
- Profitability & Margin Observations: ${p.productsServices.profitabilityObservations || 'None reported'}

[3. TARGET AUDIENCE & ICP]
- Ideal Customer Profile (ICP): ${p.targetAudience.idealCustomerProfile}
- Core Customer Segments: ${p.targetAudience.segments.join(', ') || 'Broad segment'}
- Demographics: ${p.targetAudience.demographics || 'Not specified'}
- Customer Locations: ${p.targetAudience.customerLocations || 'Domestic / Global'}
- Critical Customer Pain Points: ${p.targetAudience.painPoints.join(', ') || 'Not specified'}
- Buying Behavior: ${p.targetAudience.buyingBehavior || 'Not specified'}
- Estimated Customer Acquisition Cost (CAC): ${p.targetAudience.estimatedCac || 'Unmeasured'}
- Estimated Customer Lifetime Value (LTV): ${p.targetAudience.estimatedLtv || 'Unmeasured'}
- Retention & Churn Behavior: ${p.targetAudience.retentionBehavior || 'Not specified'}

[4. SALES, MARKETING & ACQUISITION FUNNELS]
- Primary Customer Acquisition Channels: ${p.salesMarketing.primaryChannels.join(', ') || 'Referrals / Direct'}
- Inbound & Outbound Lead Generation: ${p.salesMarketing.leadGenMethods.join(', ') || 'Not specified'}
- Website & SEO Strategy: ${p.salesMarketing.websiteAndSeo || 'Not specified'}
- Paid Advertising Channels: ${p.salesMarketing.paidAdvertising || 'Not specified'}
- Social Media Presence: ${p.salesMarketing.socialMediaPresence || 'Not specified'}
- Sales Funnel & Conversion Notes: ${p.salesMarketing.salesFunnelAndConversion || 'Not specified'}
- Monthly Leads & Conversion Numbers: ${p.salesMarketing.monthlyLeadsAndConversions || 'Not specified'}
- Sales Cycle Length: ${p.salesMarketing.salesCycleLength || 'Not specified'}
- Monthly Marketing Budget: ${p.salesMarketing.monthlyMarketingBudget || 'Not specified / $0'}
- Stated Marketing & Sales Challenges: ${p.salesMarketing.marketingChallenges.join(', ') || 'None provided'}

[5. FINANCIAL PERFORMANCE & UNIT ECONOMICS]
- Business Yearly Revenue (from mandatory registration): ${p.financials.annualRevenue || 'Not specified'}
- Approximate Monthly Revenue: ${p.financials.monthlyRevenue || 'Not specified'}
- Operating Expenses: ${p.financials.operatingExpenses || 'Not specified'}
- Approximate Net Profit Margin: ${p.financials.approximateProfitMargin || 'Not specified'}
- Cash Flow Situation: ${p.financials.cashFlowSituation}
- Pricing & Margins Notes: ${p.financials.pricingAndMarginsNotes || 'None'}
- Outstanding Debt / Liabilities: ${p.financials.outstandingDebt || '$0'}
- Major Operating Cost Drivers: ${p.financials.majorOperatingCosts || 'Not specified'}
- 1-Year Financial Goals: ${p.financials.financialGoals || 'Not specified'}

[6. OPERATIONAL INFRASTRUCTURE, TEAM & WORKFLOWS]
- Operational Bottlenecks: ${p.operations.operationalBottlenecks.join(', ') || 'None reported'}
- Key Delivery Processes: ${p.operations.keyProcesses || 'Not specified'}
- Software Stack & Tools: ${p.operations.toolsAndSoftware.join(', ') || 'Basic manual tooling'}
- Automation Opportunities Identified: ${p.operations.automationOpportunities || 'Not specified'}
- Supplier / Vendor Dependencies: ${p.operations.supplierDependencies || 'None'}
- Fulfillment Process: ${p.operations.fulfillmentProcess || 'Standard'}
- Productivity Challenges: ${p.operations.productivityChallenges || 'None reported'}

[7. COMPETITIVE LANDSCAPE & MARKET POSITIONING]
- Main Known Competitors: ${p.competition.mainCompetitors.join(', ') || 'Traditional alternatives'}
- Competitor URLs: ${(p.competition.competitorUrls || []).join(', ') || 'None'}
- Stated Key Differentiators: ${p.competition.differentiators || 'Not specified'}
- Market Opportunities: ${p.competition.marketOpportunities.join(', ') || 'Not specified'}
- Industry Trends: ${p.competition.knownIndustryTrends || 'Not specified'}
- Barriers to Entry: ${p.competition.barriersToEntry || 'Not specified'}
- Customer Alternatives / Doing Nothing: ${p.competition.customerAlternatives || 'Not specified'}

[8. STRATEGIC OBJECTIVES, CHALLENGES & AI DIRECTIVES]
- Biggest Stated Problems: ${p.challenges.biggestProblems.join(', ') || 'General scaling friction'}
- Short-Term 30-to-90 Day Goals: ${p.challenges.shortTermGoals30To90Days.join(', ') || 'Stabilize revenue'}
- Long-Term 1-to-3 Year Goals: ${p.challenges.longTermGoals1To3Years.join(', ') || 'Grow market share'}
- Revenue Growth Targets: ${p.challenges.revenueGrowthTargets || 'Not specified'}
- Expansion Plans: ${p.challenges.expansionPlans || 'None specified'}
- Desired Customer Segments: ${p.challenges.desiredCustomerSegments || 'Not specified'}
- Biggest Recognized Risks: ${p.challenges.biggestRisks.join(', ') || 'Market competition'}
- AI Advisor Requested Focus Areas: ${p.challenges.aiAdvisorFocusAreas.join(', ') || 'Growth strategy, bottleneck removal, profit margin expansion'}
`;
}

export const geminiService = {
  /**
   * Set dynamic Gemini API Key and Model at runtime
   */
  setApiKey(apiKey: string, modelName?: string) {
    const cleanKey = apiKey.trim();
    config.geminiApiKey = cleanKey;
    if (modelName && modelName.trim()) {
      config.geminiModel = modelName.trim();
    }
    if (cleanKey) {
      genAI = new GoogleGenerativeAI(cleanKey);
      console.log(`✅ [Gemini Service] Dynamic key configured with model: ${config.geminiModel}`);
    } else {
      genAI = null;
      console.log('ℹ️ [Gemini Service] Dynamic key cleared. Grounded rule engine active.');
    }
  },

  isConfigured(): boolean {
    return !!(process.env.GEMINI_API_KEY || config.geminiApiKey);
  },

  getModel(): string {
    return process.env.GEMINI_MODEL || config.geminiModel || 'gemini-3.5-flash';
  },

  /**
   * Tests an API key against Google Gemini API with a minimal ping
   */
  async testApiKey(apiKey: string, modelName?: string): Promise<{ success: boolean; message: string; model: string }> {
    const targetModel = modelName || config.geminiModel || 'gemini-3.5-flash';
    try {
      const testGenAI = new GoogleGenerativeAI(apiKey.trim());
      const model = testGenAI.getGenerativeModel({ model: targetModel });
      const res = await model.generateContent('Respond with only the single word: "VERIFIED"');
      const text = res.response.text();
      return {
        success: true,
        message: `Google Gemini API Key is valid and connected! (Model: ${targetModel}, Output: ${text.trim().slice(0, 20)})`,
        model: targetModel
      };
    } catch (err) {
      return {
        success: false,
        message: `Gemini verification error: ${(err as Error).message}`,
        model: targetModel
      };
    }
  },

  /**
   * Generates a complete, structured business analysis (Sections A through L)
   * Using Google Gemini Generative AI or intelligent grounded synthesizer fallback
   */
  async generateBusinessAnalysis(profile: IBusinessProfile): Promise<Omit<IBusinessAnalysis, 'id' | 'ownerId' | 'businessId' | 'status' | 'currentStage' | 'createdAt'>> {
    const businessContextText = formatProfileForPrompt(profile);

    const systemPrompt = `You are a friendly, experienced, and practical AI Business Advisor.
You are reviewing the business owner's answers across all 9 areas of their business to give them honest, clear, and practical advice.

LANGUAGE & TONE DIRECTIVE (CRITICAL):
- Use simple, plain, everyday conversational English that any normal business owner or founder can easily understand.
- DO NOT use high-level MBA consulting jargon, corporate buzzwords, or academic words (for example: NEVER use 'defensible vectors', 'operational friction', 'paradigm shifts', 'synergistic alignment', 'cognitive heuristics', 'unvarnished liabilities', or 'execution velocity').
- Instead, use common, friendly words: say 'what is working well', 'things to fix', 'slowdowns or bottlenecks', 'things you do better than competitors', 'unsteady sales', 'cash buffer', 'next steps'.
- Keep your explanations clear, direct, and encouraging. Speak like a helpful, honest mentor having a friendly conversation.

MANDATORY STRATEGIC DIRECTIVES:
1. REAL, HONEST PROS & CONS (DO NOT SUGARCOAT):
   - Provide 5 to 7 REAL PROS (What is working well). Identify the genuine strengths, good profit margins, strong customer relationships, or special skills evident from their answers.
   - Provide 5 to 7 REAL CONS (Real problems and weaknesses). Be honest and direct. Point out real problems like having only one way to get customers, not tracking what it costs to get a customer, tight cash flow, the owner doing too much work manually, or pricing being too low.
   - For every single Pro and Con, supply:
     * point: Clear, simple title (e.g. "Strong customer loyalty", "Too dependent on one marketing channel")
     * detail: 2-3 sentences of simple, clear explanation explaining why it matters and what effect it has
     * category: Financial | Operations | Marketing | Product | Competition | Team
     * impact: Critical | High | Moderate
     * type: 'confirmed_fact' (based directly on what the user said) or 'ai_diagnosis' (our expert advice)
     * evidenceRef: The exact step or question where the user mentioned this.

2. REAL, PRACTICAL RECOMMENDATIONS & SUGGESTIONS:
   - Provide concrete, step-by-step actions that are easy to understand. Avoid vague advice like "improve your marketing" or "hire good people".
   - State EXACTLY what to change in their prices, which marketing channel to focus on with their budget, what simple software or tool to use for bottlenecks, and how to improve cash flow.
   - Provide concrete 7-day, 30-day, 90-day, and 6-12 month prioritized action items with suggestedOwnerRole, priority, successMetric, whyItMatters, and implementationSteps.

3. FINANCIAL & COMMERCIAL ACCURACY:
   - Base all money advice on the user's reported Yearly Revenue and monthly numbers.
   - Never invent arbitrary financial numbers or claim verified metrics if not provided.
   - Include standard educational business guidance disclaimer.

4. FORMATTING:
   - Return STRICT, VALID JSON ONLY matching the exact schema specification below. No markdown fences outside of JSON.`;

    const schemaPrompt = `
Return a JSON object with this EXACT structure:
{
  "executiveSummary": {
    "overview": "string",
    "businessStage": "string",
    "mainFindings": ["string"],
    "keyOpportunities": ["string"],
    "priorityConcerns": ["string"]
  },
  "businessModelAnalysis": {
    "valueGeneration": "string",
    "revenueStreams": ["string"],
    "customerValueProposition": "string",
    "modelStrengths": ["string"],
    "modelWeaknesses": ["string"],
    "diversificationOpportunities": ["string"]
  },
  "swot": {
    "strengths": [{"point": "string", "explanation": "string", "evidenceRef": "string"}],
    "weaknesses": [{"point": "string", "explanation": "string", "evidenceRef": "string"}],
    "opportunities": [{"point": "string", "explanation": "string", "evidenceRef": "string"}],
    "threats": [{"point": "string", "explanation": "string", "evidenceRef": "string"}]
  },
  "prosAndCons": {
    "pros": [
      {
        "point": "string (Clear strategic advantage title)",
        "detail": "string (2-3 sentences of deep diagnostic rationale grounded in their answers)",
        "category": "Financial | Operations | Marketing | Product | Competition | Team",
        "impact": "Critical | High | Moderate",
        "type": "confirmed_fact",
        "evidenceRef": "string (e.g. Step 2: Unique Selling Proposition)"
      }
    ],
    "cons": [
      {
        "point": "string (Unvarnished risk/liability title)",
        "detail": "string (2-3 sentences explaining the root operational cause and strategic consequence)",
        "category": "Financial | Operations | Marketing | Product | Competition | Team",
        "impact": "Critical | High | Moderate",
        "type": "ai_hypothesis",
        "evidenceRef": "string (e.g. Step 5: Cash Flow Situation)"
      }
    ]
  },
  "marketingSalesAudit": {
    "websiteConversionOpportunities": ["string"],
    "seoAndSearchOpportunities": ["string"],
    "leadGenerationWeaknesses": ["string"],
    "advertisingEfficiency": ["string"],
    "customerAcquisitionStrategy": "string",
    "salesFunnelImprovements": ["string"],
    "brandPositioning": "string",
    "retentionAndReferral": ["string"]
  },
  "financialReview": {
    "revenueModelAssessment": "string",
    "costStructureObservations": ["string"],
    "marginImprovementOpportunities": ["string"],
    "cashFlowObservations": "string",
    "pricingConsiderations": ["string"],
    "metricsRequiringAttention": ["string"],
    "disclaimer": "This analysis provides strategic business intelligence and educational perspectives, not certified public accounting, tax, or legal advice."
  },
  "operationsProductivity": {
    "operationalBottlenecks": ["string"],
    "processImprovements": ["string"],
    "teamAndResourceGaps": ["string"],
    "automationOpportunities": ["string"],
    "technologyRecommendations": ["string"],
    "estimatedSavingsSummary": "string"
  },
  "competitivePositioning": {
    "differentiationAssessment": "string",
    "competitorComparison": "string",
    "marketPositioningOpportunities": ["string"],
    "competitiveThreats": ["string"],
    "strengtheningValueProposition": ["string"],
    "basisNotice": "Preliminary assessment based solely on self-reported inputs; external market research provider not connected."
  },
  "riskAnalysis": {
    "operationalRisks": ["string"],
    "customerConcentrationRisks": ["string"],
    "marketingDependencyRisks": ["string"],
    "financialRisks": ["string"],
    "technologySecurityRisks": ["string"],
    "competitiveRisks": ["string"],
    "mitigationMeasures": [{"risk": "string", "mitigation": "string"}]
  },
  "growthOpportunities": [
    {
      "id": "opp-1",
      "title": "string",
      "description": "string",
      "businessImpact": "High | Medium | Low",
      "implementationEffort": "High | Medium | Low",
      "estimatedCostRange": "string",
      "expectedTimeToImplement": "string",
      "dependencies": ["string"],
      "confidenceLevel": "High | Medium | Low",
      "recommendedPriority": 1
    }
  ],
  "actionPlan": [
    {
      "id": "act-1",
      "timeframe": "7_days | 30_days | 90_days | 6_12_months",
      "problemAddressed": "string",
      "recommendedAction": "string",
      "whyItMatters": "string",
      "implementationSteps": ["step 1", "step 2"],
      "priority": "Urgent | High | Medium",
      "suggestedOwnerRole": "string",
      "successMetric": "string",
      "dependenciesAndAssumptions": "string"
    }
  ],
  "informationGaps": {
    "missingInformation": ["string"],
    "assumptionsMade": ["string"],
    "lowConfidenceFindings": ["string"],
    "recommendedQuestionsToImprove": ["string"]
  }
}
`;

    // 1. Try Google Gemini API directly from server .env
    const activeApiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
    const preferredModel = process.env.GEMINI_MODEL || config.geminiModel || 'gemini-3.5-flash';
    const candidateModels = [preferredModel, 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'].filter((v, i, a) => a.indexOf(v) === i);

    if (activeApiKey) {
      if (!genAI || config.geminiApiKey !== activeApiKey) {
        genAI = new GoogleGenerativeAI(activeApiKey);
        config.geminiApiKey = activeApiKey;
      }

      for (const targetModel of candidateModels) {
        try {
          console.log(`🤖 [Gemini Service] Sending comprehensive prompt to Google Gemini model: ${targetModel}...`);
          const model = genAI.getGenerativeModel({
            model: targetModel,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          });

          const prompt = `${systemPrompt}\n\nBUSINESS DIAGNOSTIC DATA:\n${businessContextText}\n\nSCHEMA SPECIFICATION:\n${schemaPrompt}`;
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const cleanedText = cleanJsonString(text);
          const parsed = JSON.parse(cleanedText);

          console.log(`✅ [Gemini Service] Successfully generated analysis via Google Gemini (${targetModel})`);
          return {
            ...parsed,
            modelUsed: `google-gemini-${targetModel}`,
            promptVersion: ANALYSIS_PROMPT_VERSION,
            completedAt: new Date()
          };
        } catch (geminiError) {
          console.warn(`⚠️ [Gemini API] Call with [${targetModel}] failed:`, (geminiError as Error).message);
        }
      }
    }

    // 2. Intelligent rule-grounded synthesizer grounded strictly in user's inputs
    return synthesizeAnalysisFromProfile(profile);
  },

  /**
   * Personalized business chat response grounded in profile and analysis
   */
  async generateChatResponse(
    profile: IBusinessProfile,
    analysis: IBusinessAnalysis | null,
    history: IChatMessage[],
    userMessage: string
  ): Promise<{ response: string; sources?: string[]; actionItemCandidate?: any }> {
    const context = `
BUSINESS IDENTITY:
Name: ${profile.identity.businessName} (${profile.identity.industry})
Stage: ${profile.identity.businessStage} | Model: ${profile.identity.businessModel}
USP: ${profile.productsServices.usp}
Main Offerings: ${profile.productsServices.mainOfferings}
Key Bottlenecks: ${profile.operations.operationalBottlenecks.join(', ') || 'Not specified'}
Biggest Problems: ${profile.challenges.biggestProblems.join(', ') || 'Not specified'}
Financial Overview: Yearly: ${profile.financials.annualRevenue || 'Unspecified'}, Monthly: ${profile.financials.monthlyRevenue || 'Unspecified'}, Profit Margin: ${profile.financials.approximateProfitMargin || 'Unspecified'}, Cash Flow: ${profile.financials.cashFlowSituation || 'Unspecified'}

LATEST AI ANALYSIS HIGHLIGHTS:
Overview: ${analysis?.executiveSummary.overview || 'Analysis pending'}
Key Opportunities: ${analysis?.executiveSummary.keyOpportunities.join('; ') || 'None generated yet'}
Top Priority Concerns: ${analysis?.executiveSummary.priorityConcerns.join('; ') || 'None generated yet'}
`;

    const activeApiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
    const preferredModel = process.env.GEMINI_MODEL || config.geminiModel || 'gemini-3.5-flash';
    const candidateModels = [preferredModel, 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'].filter((v, i, a) => a.indexOf(v) === i);

    if (activeApiKey) {
      if (!genAI || config.geminiApiKey !== activeApiKey) {
        genAI = new GoogleGenerativeAI(activeApiKey);
        config.geminiApiKey = activeApiKey;
      }

      for (const targetModel of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: targetModel,
            systemInstruction: `You are a friendly, experienced, and practical AI Business Coach.
You are chatting one-on-one with the business owner of ${profile.identity.businessName}.

LANGUAGE DIRECTIVE (CRITICAL):
- Always use simple, clear, everyday conversational English that any normal business owner can easily understand.
- DO NOT use complicated consulting words, corporate jargon, or MBA buzzwords.
- Speak warmly and encouragingly, like a friendly, down-to-earth business mentor.
- Give practical, step-by-step advice with simple bullet points.
- If asked about next steps, offer to save important tasks directly to their action plan.
- Always base your answers on their business profile and SWOT analysis findings. If something is missing, politely ask.`,
            generationConfig: {
              temperature: 0.3
            }
          });

          const recentHistory = history.slice(-8).map((m) => `${m.sender.toUpperCase()}: ${m.content}`).join('\n');
          const prompt = `BUSINESS CONTEXT:\n${context}\n\nCONVERSATION HISTORY:\n${recentHistory}\n\nUSER MESSAGE:\n${userMessage}`;

          const result = await model.generateContent(prompt);
          const reply = result.response.text();

          console.log(`✅ [Gemini Chat] Successfully responded via Google Gemini (${targetModel})`);
          return {
            response: reply,
            sources: [profile.identity.businessName + ' Profile', `Google Gemini Live (${targetModel})`]
          };
        } catch (err) {
          console.warn(`⚠️ [Gemini Chat] Attempt with [${targetModel}] failed:`, (err as Error).message);
        }
      }
    }

    return synthesizeContextualChatResponse(profile, analysis, userMessage);
  }
};

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned.trim();
}

/**
 * High-quality deterministic synthesizer strictly based on the user's data
 */
function synthesizeAnalysisFromProfile(rawProfile: IBusinessProfile): Omit<IBusinessAnalysis, 'id' | 'ownerId' | 'businessId' | 'status' | 'currentStage' | 'createdAt'> {
  const p = sanitizeProfile(rawProfile);
  const name = p.identity.businessName;
  const industry = p.identity.industry;
  const stage = p.identity.businessStage;
  const model = p.identity.businessModel;
  const bottlenecks = p.operations.operationalBottlenecks.length ? p.operations.operationalBottlenecks : ['Capacity and manual workload'];
  const problems = p.challenges.biggestProblems.length ? p.challenges.biggestProblems : ['Inconsistent lead generation and pipeline predictability'];
  const usp = p.productsServices.usp;
  const revenueBaseline = p.financials.annualRevenue || p.financials.monthlyRevenue || 'Growing revenue tier';

  return {
    modelUsed: 'heuristic-rule-engine-v3-grounded',
    promptVersion: ANALYSIS_PROMPT_VERSION,
    completedAt: new Date(),
    executiveSummary: {
      overview: `${name} operates in ${industry} at a ${stage} stage with reported revenue around ${revenueBaseline}. With your core differentiator centered on "${usp}", you have a strong foundation. Your immediate focus is overcoming your #1 challenge ("${problems[0] || 'growing reliable sales'}") to unlock consistent profit and scale smoothly.`,
      businessStage: stage.charAt(0).toUpperCase() + stage.slice(1),
      mainFindings: [
        `Core product proposition is anchored around: ${usp}`,
        `Primary growth impediment identified: ${problems[0]}`,
        `Operational efficiency is constrained by: ${bottlenecks[0]}`,
        p.financials.annualRevenue ? `Annual revenue baseline confirmed at: ${p.financials.annualRevenue}` : 'Financial baseline metrics have not been quantified, requiring immediate tracking'
      ],
      keyOpportunities: [
        'Systematize inbound & outbound client acquisition funnels',
        'Standardize delivery workflows to unlock founder capacity',
        'Refine pricing structure to expand gross profit margins'
      ],
      priorityConcerns: [
        problems[0] || 'Unpredictable revenue cycles',
        bottlenecks[0] || 'Operational dependency on key team members'
      ]
    },
    businessModelAnalysis: {
      valueGeneration: `${name} creates tangible value by solving customer pain points (${p.productsServices.customerProblemsSolved || 'critical industry challenges'}) via its primary offerings: ${p.productsServices.mainOfferings || 'core solutions'}.`,
      revenueStreams: [
        p.productsServices.primaryRevenueGenerator || 'Direct sales of primary offerings',
        'Retainer / repeat engagement opportunities',
        'High-margin specialized packages'
      ],
      customerValueProposition: usp,
      modelStrengths: [
        'Clear problem identification for target demographic',
        'Flexible delivery mechanisms tailored to current business scale',
        `Stated USP (${usp}) separates business from generic low-cost providers`
      ],
      modelWeaknesses: [
        'Potential revenue volatility due to irregular customer acquisition rhythm',
        p.financials.cashFlowSituation === 'tight' ? 'Cash flow friction impacting aggressive reinvestment' : 'Margin expansion limited by manual overhead'
      ],
      diversificationOpportunities: [
        'Productized service tiers or recurring retainer packages',
        'Strategic partnership referrals in adjacent non-competing sectors'
      ]
    },
    swot: {
      strengths: [
        {
          point: 'Strong & Unique Value Offer',
          explanation: `You have a clear advantage: ${usp}. This helps you stand out from normal competitors.`,
          evidenceRef: 'Step 2: Products & Services (USP)'
        },
        {
          point: 'Clear Target Customers',
          explanation: `You know exactly who buys from you (${p.targetAudience.idealCustomerProfile || 'targeted customers'}), so you don't waste time or money on the wrong audience.`,
          evidenceRef: 'Step 3: Target Audience'
        },
        {
          point: 'Solves Real Customer Problems',
          explanation: `Your business directly solves: "${p.productsServices.customerProblemsSolved}". This keeps customers happy and satisfied.`,
          evidenceRef: 'Step 2: Customer Problems Solved'
        }
      ],
      weaknesses: [
        {
          point: 'Work Bottlenecks & Slowdowns',
          explanation: `These slowdowns (${bottlenecks.join(', ')}) delay customer delivery and make it hard to take on more clients.`,
          evidenceRef: 'Step 6: Operations & Team'
        },
        {
          point: 'Relying on Only One Way to Get Customers',
          explanation: `Relying mainly on (${p.salesMarketing.primaryChannels.join(', ') || 'referrals'}) means sales can drop if that channel slows down.`,
          evidenceRef: 'Step 4: Sales & Marketing'
        },
        {
          point: 'Low Profit Margins or Cash Squeeze',
          explanation: p.financials.cashFlowSituation === 'tight' || p.financials.cashFlowSituation === 'negative'
            ? 'Tight cash reserves make unexpected expenses stressful and limit your ability to hire help.'
            : 'Working hard without maximizing net profit margins leaves less cash left over to scale your operations.',
          evidenceRef: 'Step 3: Money & Financial Health'
        }
      ],
      opportunities: [
        {
          point: 'Automate Repetitive Work',
          explanation: 'Setting up simple tools for customer intake and invoices will easily save you 10+ hours every week.',
          evidenceRef: 'Step 6: Automation Opportunities'
        },
        {
          point: 'Get Repeat Business & Referrals',
          explanation: 'Following up with happy past clients can bring steady new business without paying for ads.',
          evidenceRef: 'Step 3: Target Audience LTV'
        },
        {
          point: 'Offer a Premium Package',
          explanation: 'Offering a higher-tier package with faster service can increase profit margins by 15% to 20%.',
          evidenceRef: 'Step 2: Pricing Strategy'
        }
      ],
      threats: [
        {
          point: 'Rising Marketing & Ad Costs',
          explanation: 'Getting new customers online is getting more expensive as more competitors advertise.',
          evidenceRef: 'Step 7: Competition & Market'
        },
        {
          point: 'Owner Doing Too Much Manually',
          explanation: 'When key tasks depend completely on one person without written checklists, taking time off or hiring help is very difficult.',
          evidenceRef: 'Step 6: Team Structure'
        },
        {
          point: 'Cash Flow Squeezes',
          explanation: p.financials.cashFlowSituation === 'tight' ? 'Having tight cash leaves very little cushion if a client pays late.' : 'Waiting on client payments can slow down your business plans.',
          evidenceRef: 'Step 5: Cash Flow Situation'
        }
      ]
    },
    prosAndCons: {
      pros: [
        {
          point: 'Solid Core Products & Services',
          detail: `Established delivery in ${industry} with core solutions (${p.productsServices.mainOfferings}) that solve real customer problems (${p.productsServices.customerProblemsSolved}).`,
          category: 'Product',
          impact: 'High',
          type: 'confirmed_fact',
          evidenceRef: 'Step 2: Products & Offerings'
        },
        {
          point: 'Clear Advantage Over Competitors',
          detail: `Your unique strength: "${usp}". Gives customers a strong, clear reason to pick you instead of other options.`,
          category: 'Product',
          impact: 'High',
          type: 'confirmed_fact',
          evidenceRef: 'Step 2: Unique Selling Proposition'
        },
        {
          point: 'Key Strengths Mentioned',
          detail: p.productsServices.competitiveAdvantages.length ? `Your stated strengths: ${p.productsServices.competitiveAdvantages.join(', ')}.` : 'Personalized customer care and faster turnaround than large corporate competitors.',
          category: 'Competition',
          impact: 'High',
          type: 'confirmed_fact',
          evidenceRef: 'Step 2: Competitive Advantages'
        },
        {
          point: 'Well-Defined Target Audience',
          detail: `Focusing on ${p.targetAudience.idealCustomerProfile || 'ideal buyers'} prevents wasted marketing spend on people who will never buy.`,
          category: 'Marketing',
          impact: 'Moderate',
          type: 'confirmed_fact',
          evidenceRef: 'Step 3: Ideal Customer Profile'
        },
        {
          point: 'Proven Annual Revenue Base',
          detail: `Operating at reported yearly revenue of ${revenueBaseline}, proving that real customers want and pay for your services.`,
          category: 'Financial',
          impact: 'High',
          type: 'confirmed_fact',
          evidenceRef: 'Step 5: Yearly Revenue'
        },
        {
          point: 'Clear Goals for the Future',
          detail: `You have specific milestones: short-term ("${p.challenges.shortTermGoals30To90Days[0] || 'stable revenue'}") and long-term ("${p.challenges.longTermGoals1To3Years[0] || 'grow business'}").`,
          category: 'Leadership / Team',
          impact: 'Moderate',
          type: 'confirmed_fact',
          evidenceRef: 'Step 8: Objectives & Goals'
        }
      ],
      cons: [
        {
          point: 'Work Bottlenecks Cause Slowdowns',
          detail: `Team capacity is slowed down by: "${bottlenecks.join(', ')}". This makes projects take longer, increases customer wait times, and keeps you stuck in daily busywork.`,
          category: 'Operations',
          impact: 'Critical',
          type: 'confirmed_fact',
          evidenceRef: 'Step 6: Operational Bottlenecks'
        },
        {
          point: 'Main Problem Holding Back Growth',
          detail: `You noted your biggest challenge as: "${problems.join(', ')}". Without fixing this, growing your sales will remain difficult.`,
          category: 'Operations',
          impact: 'Critical',
          type: 'confirmed_fact',
          evidenceRef: 'Step 8: Biggest Problems'
        },
        {
          point: 'Relying Too Much on One Marketing Channel',
          detail: `You get most customers through (${p.salesMarketing.primaryChannels.join(', ') || 'referrals/direct'}). If this channel dries up or slows down, new sales can drop quickly.`,
          category: 'Marketing',
          impact: 'High',
          type: 'ai_hypothesis',
          evidenceRef: 'Step 4: Primary Channels'
        },
        {
          point: 'Pricing May Be Too Low for True Profitability',
          detail: 'When prices are set too low, you have to work long hours just to cover expenses. Introducing a 15-20% price increase or a higher-tier package can directly boost take-home profit without increasing your workload.',
          category: 'Financial',
          impact: 'High',
          type: 'ai_hypothesis',
          evidenceRef: 'Step 3: Money & Financial Health'
        },
        {
          point: 'Cash Flow Can Get Tight',
          detail: p.financials.cashFlowSituation === 'tight' || p.financials.cashFlowSituation === 'negative'
            ? `Your cash flow is reported as "${p.financials.cashFlowSituation}". Having a low cash buffer makes late client payments stressful and slows down business growth.`
            : `Cash flow is reported as "${p.financials.cashFlowSituation || 'variable'}". Building a 60-day cash reserve will protect your business from unpredictable slow periods.`,
          category: 'Financial',
          impact: p.financials.cashFlowSituation === 'tight' || p.financials.cashFlowSituation === 'negative' ? 'Critical' : 'Moderate',
          type: 'confirmed_fact',
          evidenceRef: 'Step 5: Cash Flow Situation'
        },
        {
          point: 'Competitors Offer Similar Services',
          detail: `You compete directly against ${p.competition.mainCompetitors.join(', ') || 'other providers'}. Clear customer reviews and proof of past results are needed so clients do not shop around for cheaper options.`,
          category: 'Competition',
          impact: 'Moderate',
          type: 'ai_hypothesis',
          evidenceRef: 'Step 7: Main Competitors'
        },
        {
          point: 'Too Many Tasks Handled Manually',
          detail: 'Administrative paperwork, quotes, and client follow-ups are still done by hand. Simple automations can save you 10 to 15 hours every week.',
          category: 'Operations',
          impact: 'High',
          type: 'ai_hypothesis',
          evidenceRef: 'Step 6: Tools & Software'
        }
      ]
    },
    marketingSalesAudit: {
      websiteConversionOpportunities: [
        'Deploy explicit social proof testimonials directly above primary call-to-action buttons',
        'Introduce a frictionless diagnostic or self-qualification audit to capture lead contact details'
      ],
      seoAndSearchOpportunities: [
        `Develop authoritative long-tail content addressing core customer pain points: ${p.targetAudience.painPoints.join(', ') || 'operational efficiency'}`,
        'Optimize Google Business Profile and industry-specific directory listings'
      ],
      leadGenerationWeaknesses: [
        'Absence of multi-touch automated follow-up sequences for cold inquiries',
        'Over-dependence on episodic word-of-mouth rather than predictable pipeline mechanisms'
      ],
      advertisingEfficiency: [
        'Validate unit economics before scaling paid ad spend; establish known CAC benchmarks first.'
      ],
      customerAcquisitionStrategy: `Focus on high-intent account outreach and strategic referral networks matching ${p.targetAudience.idealCustomerProfile || 'ideal buyer persona'}.`,
      salesFunnelImprovements: [
        'Implement a standardized 3-stage discovery & qualification rubric',
        'Introduce written proposal turnaround SLAs within 24 hours of client discovery'
      ],
      brandPositioning: `Position ${name} as the authoritative, results-driven specialist in ${industry}, steering away from commoditized cost competition.`,
      retentionAndReferral: [
        'Institutionalize a Day-45 post-onboarding satisfaction review and referral request protocol'
      ]
    },
    financialReview: {
      revenueModelAssessment: `Revenue generation is currently structured around ${p.productsServices.pricingModel || 'standard pricing'}. With reported annual revenue of ${revenueBaseline}, potential exists to package high-demand offerings into recurring or value-indexed tiers.`,
      costStructureObservations: [
        'Personnel and manual operations represent the primary cost driver',
        'Direct fulfillment expenses require monitoring against gross margin benchmarks'
      ],
      marginImprovementOpportunities: [
        'Audit supplier/software expenses quarterly for unused subscriptions or duplicate services',
        'Introduce tiered premium service level agreements (SLAs) with 20-30% higher margins'
      ],
      cashFlowObservations: p.financials.cashFlowSituation ? `Reported cash flow status: ${p.financials.cashFlowSituation}. Ensure 60-day operating buffer reserves.` : 'Cash flow metrics not reported; establishing a 13-week rolling cash forecast is advised.',
      pricingConsiderations: [
        'Test a 10-15% price adjustment on new customer acquisitions to gauge price elasticity',
        'Bundle value-add services to increase average order value (AOV)'
      ],
      metricsRequiringAttention: [
        'Customer Acquisition Cost (CAC)',
        'Customer Lifetime Value (LTV)',
        'Monthly Gross Margin %',
        'Net Operating Cash Flow'
      ],
      disclaimer: 'This review provides strategic business intelligence and educational perspectives, not certified public accounting, tax, or legal advice.'
    },
    operationsProductivity: {
      operationalBottlenecks: bottlenecks,
      processImprovements: [
        'Document standard operating procedures (SOPs) for the top 5 recurring client delivery tasks',
        'Implement a centralized project management and ticket intake board'
      ],
      teamAndResourceGaps: [
        'Specialized operations/growth coordinator to unburden executive leadership'
      ],
      automationOpportunities: [
        'Automate lead capture and CRM synchronization via webhook integrations',
        'Automate invoice generation and automated payment reminders'
      ],
      technologyRecommendations: [
        'Centralized CRM (e.g. HubSpot or Pipedrive)',
        'Workflow automation middleware (Make / Zapier)',
        'Knowledge base repository (Notion / Google Workspace)'
      ],
      estimatedSavingsSummary: 'Estimated 10-15 hours per week of founder/management time recoverable through automated intake and SOP-backed delegation.'
    },
    competitivePositioning: {
      differentiationAssessment: `Unique selling proposition: "${usp}" provides a distinct angle against competitors (${p.competition.mainCompetitors.join(', ') || 'standard market rivals'}).`,
      competitorComparison: `Direct competitors rely primarily on conventional approaches. ${name} can dominate by highlighting speed, specialized focus, and verifiable client ROI.`,
      marketPositioningOpportunities: [
        'Claim the category leadership niche for high-touch, dependable execution',
        'Publish transparent case studies detailing tangible business impact'
      ],
      competitiveThreats: [
        'Low-cost offshore or commoditized alternative providers entering the market',
        'Competitors adopting aggressive digital acquisition tactics'
      ],
      strengtheningValueProposition: [
        'Formalize a guarantee or satisfaction milestone agreement',
        'Provide complimentary diagnostic onboarding audits'
      ],
      basisNotice: 'Preliminary assessment based solely on self-reported inputs; external market research provider not connected.'
    },
    riskAnalysis: {
      operationalRisks: ['Bottlenecks in key personnel capacity', 'Lack of redundant documented processes'],
      customerConcentrationRisks: ['Potential vulnerability if top 20% of clients account for majority of billings'],
      marketingDependencyRisks: ['Inadequate diversification across organic, referral, and direct acquisition channels'],
      financialRisks: ['Cash flow timing mismatches between receivables and supplier obligations'],
      technologySecurityRisks: ['Data governance and customer information backup security'],
      competitiveRisks: ['Competitors mimicking core positioning or discounting service fees'],
      mitigationMeasures: [
        {
          risk: 'Operational bottleneck & key-person risk',
          mitigation: 'Implement written SOPs and cross-train team members on critical execution paths within 30 days.'
        },
        {
          risk: 'Lead flow volatility',
          mitigation: 'Build an automated email nurturing campaign and establish regular referral partnerships with non-competing peers.'
        },
        {
          risk: 'Receivables delays',
          mitigation: 'Mandate 50% upfront deposits or automatic credit card billing for all service engagements.'
        }
      ]
    },
    growthOpportunities: [
      {
        id: 'opp-1',
        title: 'Systematized Inbound Lead Generation Engine',
        description: `Build a dedicated high-converting landing page paired with an automated email nurture sequence targeting ${p.targetAudience.idealCustomerProfile || 'ideal buyers'}.`,
        businessImpact: 'High',
        implementationEffort: 'Medium',
        estimatedCostRange: '$200 - $600',
        expectedTimeToImplement: '2-3 weeks',
        dependencies: ['Clear buyer persona definition', 'Lead magnet / diagnostic asset'],
        confidenceLevel: 'High',
        recommendedPriority: 1
      },
      {
        id: 'opp-2',
        title: 'Core Workflow & Intake Automation',
        description: `Automate client onboarding, agreement e-signatures, and kickoff scheduling to eliminate "${bottlenecks[0]}".`,
        businessImpact: 'High',
        implementationEffort: 'Low',
        estimatedCostRange: '$50 - $150',
        expectedTimeToImplement: '1 week',
        dependencies: ['Make / Zapier accounts', 'Standardized intake questionnaire'],
        confidenceLevel: 'High',
        recommendedPriority: 2
      },
      {
        id: 'opp-3',
        title: 'Premium Tier Packaging & Value Pricing',
        description: 'Introduce an executive/priority tier with enhanced SLAs and advisory touchpoints, priced 25-35% higher.',
        businessImpact: 'Medium',
        implementationEffort: 'Low',
        estimatedCostRange: '$0',
        expectedTimeToImplement: '1-2 weeks',
        dependencies: ['Customer feedback review', 'Updated proposal deck'],
        confidenceLevel: 'Medium',
        recommendedPriority: 3
      }
    ],
    actionPlan: [
      {
        id: 'act-1',
        timeframe: '7_days',
        problemAddressed: 'Unclear baseline pipeline conversion metrics',
        recommendedAction: 'Audit and map the current customer journey from first contact to signed engagement.',
        whyItMatters: 'Reveals exact leakage points in your sales process where potential revenue is slipping away.',
        implementationSteps: [
          'List all inquiries received in the last 60 days',
          'Calculate conversion rate percentage at each milestone',
          'Identify top 2 reasons prospects stalled or dropped out'
        ],
        priority: 'Urgent',
        suggestedOwnerRole: 'Founder / Managing Director',
        successMetric: 'Completed conversion map with identified bottleneck stage',
        dependenciesAndAssumptions: 'Access to email history and messaging logs'
      },
      {
        id: 'act-2',
        timeframe: '7_days',
        problemAddressed: 'Manual intake and administrative drag',
        recommendedAction: 'Set up an automated calendar link with mandatory pre-qualification questions.',
        whyItMatters: 'Filters unqualified prospects immediately and saves 3+ hours per week of scheduling back-and-forth.',
        implementationSteps: [
          'Create appointment type on Calendly / Cal.com',
          'Add 3 qualifying questions (budget, timeline, primary objective)',
          'Embed calendar link on website and email signatures'
        ],
        priority: 'High',
        suggestedOwnerRole: 'Operations Lead',
        successMetric: '100% of new discovery calls scheduled through automated qualifying flow'
      },
      {
        id: 'act-3',
        timeframe: '30_days',
        problemAddressed: 'Operational bottleneck: ' + bottlenecks[0],
        recommendedAction: 'Document Standard Operating Procedures (SOPs) for the core fulfillment cycle.',
        whyItMatters: 'Enables delegation, guarantees quality control, and prepares the business for scalable hiring.',
        implementationSteps: [
          'Record short Loom video walkthroughs for top 3 repetitive tasks',
          'Transcribe into step-by-step checklists in Notion or Docs',
          'Run a delegation trial with an assistant or team member'
        ],
        priority: 'High',
        suggestedOwnerRole: 'Operations / Project Manager',
        successMetric: '3 core fulfillment SOPs published and verified by team'
      },
      {
        id: 'act-4',
        timeframe: '90_days',
        problemAddressed: 'Revenue predictability and customer lifetime value',
        recommendedAction: 'Launch a structured client retention and referral program.',
        whyItMatters: 'Acquiring a new client costs 5x more than retaining an existing client or gaining an inbound referral.',
        implementationSteps: [
          'Institute automated 45-day satisfaction check-ins',
          'Offer existing clients incentive credits or complimentary audits for warm introductions',
          'Set a target of 2 referral opportunities per completed project'
        ],
        priority: 'Medium',
        suggestedOwnerRole: 'Account Management / Growth Lead',
        successMetric: 'Minimum 20% increase in repeat engagements or referral leads'
      },
      {
        id: 'act-5',
        timeframe: '6_12_months',
        problemAddressed: 'Strategic category leadership and market expansion',
        recommendedAction: 'Establish an authoritative industry benchmark report or proprietary methodology.',
        whyItMatters: 'Positions ' + name + ' as the preeminent authority in ' + industry + ', commanding premium pricing.',
        implementationSteps: [
          'Survey existing client base on industry challenges',
          'Publish findings as a branded whitepaper or executive guide',
          'Pitch findings to industry publications and podcasts'
        ],
        priority: 'Medium',
        suggestedOwnerRole: 'Chief Executive Officer',
        successMetric: 'Recognized industry publication and 50+ inbound enterprise leads'
      }
    ],
    informationGaps: {
      missingInformation: [
        p.financials.monthlyRevenue ? '' : 'Verified monthly gross & net revenue figures',
        p.targetAudience.estimatedCac ? '' : 'Precise Customer Acquisition Cost (CAC) by channel',
        p.targetAudience.estimatedLtv ? '' : 'Customer Lifetime Value (LTV) calculation'
      ].filter(Boolean),
      assumptionsMade: [
        'Assumed current profit margins are in line with typical industry standards for ' + industry,
        'Assumed primary sales cycle length is between 14 and 45 days based on business stage'
      ],
      lowConfidenceFindings: [
        'Competitor ad spend and digital budget estimates (external crawler not connected)',
        'Exact customer churn rate over 12-month periods'
      ],
      recommendedQuestionsToImprove: [
        'What is your exact customer churn rate or average engagement lifespan in months?',
        'What percentage of past revenue came from repeat customers vs new logos?',
        'What is your target gross margin percentage for the upcoming fiscal quarter?'
      ]
    }
  };
}

function synthesizeContextualChatResponse(
  rawProfile: IBusinessProfile,
  analysis: IBusinessAnalysis | null,
  userMessage: string
): { response: string; sources?: string[]; actionItemCandidate?: any } {
  const profile = sanitizeProfile(rawProfile);
  const msg = userMessage.toLowerCase();
  const name = profile.identity.businessName;

  if (msg.includes('growth') || msg.includes('increase revenue') || msg.includes('grow')) {
    return {
      response: `### How to Grow Revenue at ${name}

Looking at your business details (**${profile.identity.industry}**, Yearly Revenue: **${profile.financials.annualRevenue || 'Established'}**), here are 3 simple, practical ways to increase your income:

1. **Test a Small Price Increase or Offer a Premium Package**
   - Check your current pricing (${profile.productsServices.pricingModel || 'standard rates'}).
   - Try raising your price by 10% to 15% on your next 3 new clients, or offer a "VIP / Express" service. Most businesses in ${profile.identity.industry} charge less than what their value (${profile.productsServices.usp}) is worth.

2. **Follow Up Faster on New Leads**
   - Your main challenge was: *${profile.challenges.biggestProblems[0] || 'getting steady leads'}*.
   - Try to answer all new inquiries within 2 hours. Studies show that contacting prospects fast makes them 3 times more likely to become paying clients.

3. **Ask Happy Past Clients for Referrals**
   - Message your top 5 favorite clients this week. Thank them, check how they are doing, and ask if they know one person or company who might need your help.

Would you like me to create an easy 7-day checklist to test the price increase?`,
      sources: [`${name} Profile: Business Details`, 'Growth Advisor'],
      actionItemCandidate: {
        title: 'Test 15% higher price on next 3 client quotes',
        description: 'See if new clients accept a slightly higher rate with premium service.',
        timeframe: '7_days',
        priority: 'high'
      }
    };
  }

  if (msg.includes('weakness') || msg.includes('problem') || msg.includes('risk') || msg.includes('con')) {
    const mainProblem = profile.challenges.biggestProblems[0] || 'Unsteady leads and sales';
    const bottleneck = profile.operations.operationalBottlenecks[0] || 'Too much manual work';

    return {
      response: `### Top Things to Fix at ${name}

Based on what you shared, here are the main areas holding your business back right now:

1. **${mainProblem}**
   - **Why this hurts you:** When sales are unpredictable, it is hard to plan your monthly budget or hire help.
   - **How to fix it:** Pick one reliable marketing method and set aside 30 minutes every day to do outreach or follow-ups.

2. **${bottleneck}**
   - **Why this hurts you:** If projects take too long or depend completely on you, you cannot take on more clients without burning out.
   - **How to fix it:** Write down a simple step-by-step checklist for this task so someone else can assist you or you can automate it.

3. **Cash Flow Buffer**
   - **Your current status:** *${profile.financials.cashFlowSituation || 'unspecified'}*.
   - **How to fix it:** Ask for a 50% deposit before starting projects, and aim to keep a 60-day cash savings cushion in your business bank account.

Would you like me to turn these steps into simple tasks on your dashboard?`,
      sources: [`${name} Profile: Operations, Money & Challenges`],
      actionItemCandidate: {
        title: `Write simple checklist for ${bottleneck}`,
        description: 'Document the steps for this bottleneck so it is faster and easier to delegate.',
        timeframe: '30_days',
        priority: 'urgent'
      }
    };
  }

  if (msg.includes('marketing') || msg.includes('lead') || msg.includes('channel')) {
    return {
      response: `### Best Marketing Advice for ${name}

In **${profile.identity.industry}**, you will get much better results by mastering **1 main marketing channel** instead of spreading yourself too thin across 5:

| Marketing Focus | Why It Works | What to Track |
| :--- | :--- | :--- |
| **Direct Outreach** | Reaches your ideal customers (${profile.targetAudience.idealCustomerProfile || 'decision makers'}) directly. | Number of conversations started |
| **Referrals from Happy Clients** | Free to get and clients already trust you. | Number of referral introductions |
| **Helpful Content & Search** | Brings in people who are already looking for help. | Website inquiries received |

**Helpful Tip:**
Before spending money on paid advertisements, make sure your website or profile has clear testimonials showing past results.`,
      sources: ['Marketing Review', 'Target Audience Details']
    };
  }

  // General contextual advisory response
  return {
    response: `### Practical Advice for ${name}

Here are the most helpful things to focus on right now for your business:

- **Your Biggest Strength:** *"${profile.productsServices.usp}"*. Make sure this is the first thing people read on your website or social media!
- **Top Thing to Fix:** Solve the bottleneck around *${profile.operations.operationalBottlenecks[0] || 'work capacity'}* so you can handle new customers easily.
- **Your Next Goal:** Focus on your short-term goal: *${profile.challenges.shortTermGoals30To90Days[0] || 'Steady monthly sales'}*.

Feel free to ask any specific question about pricing, getting more customers, or saving time!`,
    sources: [`${name} Profile Details`]
  };
}
