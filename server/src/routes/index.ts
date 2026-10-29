import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest, generateToken } from '../middleware/auth.js';
import { repository } from '../db/repository.js';
import { geminiService } from '../services/geminiService.js';
import { config } from '../config/env.js';
import { IBusinessProfile, IBusinessAnalysis, IReport, IActionItem } from '../types/index.js';
import { adminRouter } from './adminRoutes.js';
import { encryptPassword, verifyPassword, isEncryptedPassword } from '../utils/security.js';

export const apiRouter = Router();

// Mount Admin Router for system management and user directory inspection
apiRouter.use('/admin', adminRouter);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param || '';
}

// ==========================================
// 1. AUTHENTICATION & USER REGISTRATION
// ==========================================

// Register with Gmail/Email, Password, Confirm Password, Mobile Number, and Yearly Revenue
apiRouter.post('/auth/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password, confirmPassword, mobileNumber, yearlyRevenue, displayName, businessName } = req.body;

    // Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Valid Gmail/Email ID is mandatory.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Password and Confirm Password do not match.' });
      return;
    }
    if (!mobileNumber || typeof mobileNumber !== 'string' || mobileNumber.trim().length < 6) {
      res.status(400).json({ success: false, error: 'Mobile number is mandatory.' });
      return;
    }
    if (!yearlyRevenue || typeof yearlyRevenue !== 'string' || !yearlyRevenue.trim()) {
      res.status(400).json({ success: false, error: 'Business Yearly Revenue is mandatory.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await repository.getUserByEmail(cleanEmail);
    if (existing) {
      res.status(400).json({ success: false, error: 'An enterprise account already exists with this email. Please sign in.' });
      return;
    }

    const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const encryptedPassword = encryptPassword(password);
    const user = await repository.upsertUser({
      uid,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      mobileNumber: mobileNumber.trim(),
      yearlyRevenue: yearlyRevenue.trim(),
      password: encryptedPassword, // Stored safely in encrypted AES-256-GCM form in MongoDB
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = generateToken({ uid: user.uid, email: user.email, name: user.displayName });

    // Seed initial business profile pre-filled with their yearly revenue
    const bizId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const initialBiz: IBusinessProfile = {
      id: bizId,
      ownerId: user.uid,
      isDraft: true,
      currentStep: 1,
      completionPercentage: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
      identity: {
        businessName: businessName?.trim() || `${user.displayName}'s Enterprise`,
        industry: 'Commercial & Services',
        country: 'United States',
        targetMarkets: ['Domestic'],
        businessModel: 'b2b',
        businessStage: 'growing',
        description: ''
      },
      productsServices: {
        mainOfferings: '',
        pricingModel: 'Fixed',
        usp: '',
        competitiveAdvantages: [],
        customerProblemsSolved: ''
      },
      targetAudience: {
        idealCustomerProfile: '',
        segments: [],
        painPoints: []
      },
      salesMarketing: {
        primaryChannels: [],
        leadGenMethods: [],
        marketingChallenges: []
      },
      financials: {
        annualRevenue: yearlyRevenue.trim(),
        cashFlowSituation: 'unknown'
      },
      operations: {
        toolsAndSoftware: [],
        operationalBottlenecks: []
      },
      competition: {
        mainCompetitors: [],
        marketOpportunities: []
      },
      challenges: {
        biggestProblems: [],
        shortTermGoals30To90Days: [],
        longTermGoals1To3Years: [],
        biggestRisks: [],
        aiAdvisorFocusAreas: []
      }
    };
    await repository.saveBusiness(initialBiz);

    // Strip password credential from API response for privacy
    const { password: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      user: safeUser,
      token,
      business: initialBiz,
      message: 'Registration successful.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Login with Email and Password
apiRouter.post('/auth/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await repository.getUserByEmail(cleanEmail);
    if (!user) {
      res.status(401).json({ success: false, error: 'No account found with this email. Please register.' });
      return;
    }

    // Verify candidate password against encrypted or hashed password stored in MongoDB
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
      return;
    }

    // If existing account was using legacy unencrypted password, upgrade it to encrypted format
    if (user.password && !isEncryptedPassword(user.password)) {
      user.password = encryptPassword(password);
      await repository.upsertUser(user);
    }

    const token = generateToken({ uid: user.uid, email: user.email, name: user.displayName });
    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      user: safeUser,
      token,
      message: 'Sign in successful.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get Current User Profile
apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await repository.getUserByUid(req.user!.uid);
    if (user) {
      if (!user.displayName) {
        user.displayName = user.email.split('@')[0] || 'Executive User';
      }
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
      return;
    }
    const fallbackUser = {
      uid: req.user!.uid,
      email: req.user!.email,
      displayName: req.user!.name || req.user!.email?.split('@')[0] || 'Executive User',
      mobileNumber: req.user!.mobileNumber,
      yearlyRevenue: req.user!.yearlyRevenue,
      photoURL: req.user!.picture
    };
    res.json({ success: true, user: fallbackUser });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Sync user session
apiRouter.post('/auth/session', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const existing = await repository.getUserByUid(user.uid);
    const updated = await repository.upsertUser({
      uid: user.uid,
      email: user.email,
      displayName: user.name || (existing ? existing.displayName : 'Business Leader'),
      photoURL: user.picture || (existing ? existing.photoURL : ''),
      createdAt: existing ? existing.createdAt : new Date(),
      updatedAt: new Date()
    });
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==========================================
// 2. BUSINESS PROFILES & STEPPER DRAFTS
// ==========================================
apiRouter.get('/businesses', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businesses = await repository.getBusinessesByOwner(req.user!.uid);
    res.json({ success: true, businesses });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/businesses', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user!.uid;
    const body = req.body;
    const id = body.id || 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newProfile: IBusinessProfile = {
      id,
      ownerId,
      isDraft: body.isDraft !== undefined ? body.isDraft : true,
      currentStep: body.currentStep || 1,
      completionPercentage: body.completionPercentage || 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      identity: body.identity || {
        businessName: 'My Enterprise',
        industry: 'Technology & SaaS',
        description: '',
        country: 'United States',
        targetMarkets: ['Domestic'],
        businessModel: 'b2b',
        businessStage: 'growing'
      },
      productsServices: body.productsServices || {
        mainOfferings: '',
        pricingModel: 'Fixed',
        usp: '',
        competitiveAdvantages: [],
        customerProblemsSolved: ''
      },
      targetAudience: body.targetAudience || {
        idealCustomerProfile: '',
        segments: [],
        painPoints: []
      },
      salesMarketing: body.salesMarketing || {
        primaryChannels: [],
        leadGenMethods: [],
        marketingChallenges: []
      },
      financials: body.financials || {
        cashFlowSituation: 'unknown'
      },
      operations: body.operations || {
        toolsAndSoftware: [],
        operationalBottlenecks: []
      },
      competition: body.competition || {
        mainCompetitors: [],
        marketOpportunities: []
      },
      challenges: body.challenges || {
        biggestProblems: [],
        shortTermGoals30To90Days: [],
        longTermGoals1To3Years: [],
        biggestRisks: [],
        aiAdvisorFocusAreas: []
      }
    };

    const saved = await repository.saveBusiness(newProfile);
    res.status(201).json({ success: true, business: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/businesses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const business = await repository.getBusinessById(id, req.user!.uid);
    if (!business) {
      res.status(404).json({ success: false, error: 'Business profile not found or access denied.' });
      return;
    }
    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.patch('/businesses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const existing = await repository.getBusinessById(id, req.user!.uid);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Business profile not found.' });
      return;
    }
    const updatedProfile: IBusinessProfile = {
      ...existing,
      ...req.body,
      id: existing.id,
      ownerId: existing.ownerId,
      updatedAt: new Date()
    };
    const saved = await repository.saveBusiness(updatedProfile);
    res.json({ success: true, business: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.put('/businesses/:id/draft', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const existing = await repository.getBusinessById(id, req.user!.uid);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Business profile not found.' });
      return;
    }
    const updatedDraft: IBusinessProfile = {
      ...existing,
      ...req.body,
      id: existing.id,
      ownerId: existing.ownerId,
      isDraft: true,
      updatedAt: new Date()
    };
    const saved = await repository.saveBusiness(updatedDraft);
    res.json({ success: true, business: saved, autosavedAt: saved.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.delete('/businesses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const success = await repository.deleteBusiness(id, req.user!.uid);
    res.json({ success, message: 'Business profile and associated data removed.' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==========================================
// 3. AI BUSINESS ANALYSIS WORKFLOW
// ==========================================
apiRouter.post('/businesses/:id/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = getParam(req.params.id);
    const ownerId = req.user!.uid;

    const profile = await repository.getBusinessById(businessId, ownerId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Business profile not found.' });
      return;
    }

    const existingAnalyses = await repository.getAnalysesByBusiness(businessId, ownerId);
    const active = existingAnalyses.find((a) => a.status === 'running' || a.status === 'pending');
    if (active) {
      res.json({ success: true, analysis: active, message: 'Analysis is already in progress.' });
      return;
    }

    const analysisId = 'analysis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    let analysisRecord: IBusinessAnalysis = {
      id: analysisId,
      ownerId,
      businessId,
      status: 'running',
      currentStage: 'Reading your business answers',
      createdAt: new Date(),
      modelUsed: 'gemini-3.5-flash',
      promptVersion: 'v2.1-executive',
      executiveSummary: { overview: '', businessStage: '', mainFindings: [], keyOpportunities: [], priorityConcerns: [] },
      businessModelAnalysis: { valueGeneration: '', revenueStreams: [], customerValueProposition: '', modelStrengths: [], modelWeaknesses: [], diversificationOpportunities: [] },
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      prosAndCons: { pros: [], cons: [] },
      marketingSalesAudit: { websiteConversionOpportunities: [], seoAndSearchOpportunities: [], leadGenerationWeaknesses: [], advertisingEfficiency: [], customerAcquisitionStrategy: '', salesFunnelImprovements: [], brandPositioning: '', retentionAndReferral: [] },
      financialReview: { revenueModelAssessment: '', costStructureObservations: [], marginImprovementOpportunities: [], cashFlowObservations: '', pricingConsiderations: [], metricsRequiringAttention: [], disclaimer: '' },
      operationsProductivity: { operationalBottlenecks: [], processImprovements: [], teamAndResourceGaps: [], automationOpportunities: [], technologyRecommendations: [] },
      competitivePositioning: { differentiationAssessment: '', competitorComparison: '', marketPositioningOpportunities: [], competitiveThreats: [], strengtheningValueProposition: [], basisNotice: '' },
      riskAnalysis: { operationalRisks: [], customerConcentrationRisks: [], marketingDependencyRisks: [], financialRisks: [], technologySecurityRisks: [], competitiveRisks: [], mitigationMeasures: [] },
      growthOpportunities: [],
      actionPlan: [],
      informationGaps: { missingInformation: [], assumptionsMade: [], lowConfidenceFindings: [], recommendedQuestionsToImprove: [] }
    };

    await repository.saveAnalysis(analysisRecord);

    (async () => {
      try {
        const stages = [
          'Reading your business answers',
          'Evaluating your business model',
          'Finding your strengths & weaknesses',
          'Discovering growth opportunities',
          'Analyzing bottlenecks & risks',
          'Creating your action roadmap',
          'Preparing executive summary & report'
        ];

        // 1. Immediately kick off Gemini AI analysis in parallel (no artificial blocking delay)
        const geminiPromise = geminiService.generateBusinessAnalysis(profile);

        // 2. Pace the 7 diagnostic stages evenly across the analysis time (~6.5s per stage)
        let stageIdx = 0;
        analysisRecord.currentStage = stages[0];
        await repository.saveAnalysis(analysisRecord);

        const stageInterval = setInterval(async () => {
          stageIdx++;
          if (stageIdx < stages.length) {
            analysisRecord.currentStage = stages[stageIdx];
            await repository.saveAnalysis(analysisRecord);
          }
        }, 6500);

        let generatedData;
        try {
          generatedData = await geminiPromise;
        } finally {
          clearInterval(stageInterval);
        }

        analysisRecord = {
          ...analysisRecord,
          ...generatedData,
          status: 'completed',
          currentStage: 'Completed',
          completedAt: new Date()
        };

        await repository.saveAnalysis(analysisRecord);

        // Auto-seed initial action items from the generated action plan
        if (analysisRecord.actionPlan && analysisRecord.actionPlan.length > 0) {
          for (const item of analysisRecord.actionPlan.slice(0, 4)) {
            const actionId = 'action_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            const tf = item.timeframe === '6_12_months' ? 'long_term' : item.timeframe;
            await repository.saveActionItem({
              id: actionId,
              ownerId,
              businessId,
              title: item.recommendedAction,
              description: `${item.problemAddressed} - ${item.whyItMatters}`,
              category: 'Strategic Initiative',
              priority: item.priority.toLowerCase() as any,
              timeframe: tf as any,
              status: 'todo',
              ownerRole: item.suggestedOwnerRole,
              successMetric: item.successMetric,
              source: 'ai_action_plan',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      } catch (genErr) {
        analysisRecord.status = 'failed';
        analysisRecord.error = (genErr as Error).message || 'AI processing encountered an error.';
        await repository.saveAnalysis(analysisRecord);
      }
    })();

    res.status(202).json({ success: true, analysis: analysisRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/businesses/:id/analyses', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const list = await repository.getAnalysesByBusiness(id, req.user!.uid);
    res.json({ success: true, analyses: list });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/analyses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const analysis = await repository.getAnalysisById(id, req.user!.uid);
    if (!analysis) {
      res.status(404).json({ success: false, error: 'Analysis not found or access denied.' });
      return;
    }
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/analyses/:id/retry', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const existing = await repository.getAnalysisById(id, req.user!.uid);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Analysis record not found.' });
      return;
    }
    const profile = await repository.getBusinessById(existing.businessId, req.user!.uid);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Associated business profile not found.' });
      return;
    }

    existing.status = 'running';
    existing.currentStage = 'Reading your business answers';
    existing.error = undefined;
    await repository.saveAnalysis(existing);

    (async () => {
      try {
        const stages = [
          'Reading your business answers',
          'Evaluating your business model',
          'Finding your strengths & weaknesses',
          'Discovering growth opportunities',
          'Analyzing bottlenecks & risks',
          'Creating your action roadmap',
          'Preparing executive summary & report'
        ];

        // 1. Immediately kick off Gemini AI generation in parallel
        const geminiPromise = geminiService.generateBusinessAnalysis(profile);

        // 2. Pace stages evenly across analysis time (~6.5s per stage)
        let stageIdx = 0;
        existing.currentStage = stages[0];
        await repository.saveAnalysis(existing);

        const stageInterval = setInterval(async () => {
          stageIdx++;
          if (stageIdx < stages.length) {
            existing.currentStage = stages[stageIdx];
            await repository.saveAnalysis(existing);
          }
        }, 6500);

        let generated;
        try {
          generated = await geminiPromise;
        } finally {
          clearInterval(stageInterval);
        }

        const updated = {
          ...existing,
          ...generated,
          status: 'completed' as const,
          currentStage: 'Completed',
          completedAt: new Date()
        };
        await repository.saveAnalysis(updated);
      } catch (err) {
        existing.status = 'failed';
        existing.error = (err as Error).message;
        await repository.saveAnalysis(existing);
      }
    })();

    res.json({ success: true, analysis: existing });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==========================================
// 4. PERSONALIZED AI CHAT & ADVISOR
// ==========================================
apiRouter.get('/businesses/:id/conversations', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const conversations = await repository.getConversations(id, req.user!.uid);
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/businesses/:id/conversations', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = getParam(req.params.id);
    const ownerId = req.user!.uid;
    const title = req.body.title || 'Executive Advisory Session';
    const id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const conv = await repository.saveConversation({
      id,
      ownerId,
      businessId,
      title,
      createdAt: new Date(),
      lastMessageAt: new Date()
    });

    res.status(201).json({ success: true, conversation: conv });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const conversation = await repository.getConversationById(id, req.user!.uid);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found.' });
      return;
    }
    const messages = await repository.getMessagesByConversation(conversation.id, req.user!.uid);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const conversation = await repository.getConversationById(id, req.user!.uid);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found.' });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: 'Message content is required.' });
      return;
    }

    const ownerId = req.user!.uid;
    const business = await repository.getBusinessById(conversation.businessId, ownerId);
    if (!business) {
      res.status(404).json({ success: false, error: 'Business context unavailable.' });
      return;
    }

    const analyses = await repository.getAnalysesByBusiness(business.id, ownerId);
    const latestAnalysis = analyses.find((a) => a.status === 'completed') || null;

    const userMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const userMessage = await repository.saveChatMessage({
      id: userMsgId,
      ownerId,
      conversationId: conversation.id,
      businessId: business.id,
      sender: 'user',
      content,
      createdAt: new Date()
    });

    const history = await repository.getMessagesByConversation(conversation.id, ownerId);
    const aiResult = await geminiService.generateChatResponse(business, latestAnalysis, history, content);

    const aiMsgId = 'msg_' + (Date.now() + 1) + '_' + Math.random().toString(36).substring(2, 6);
    const assistantMessage = await repository.saveChatMessage({
      id: aiMsgId,
      ownerId,
      conversationId: conversation.id,
      businessId: business.id,
      sender: 'assistant',
      content: aiResult.response,
      sources: aiResult.sources,
      actionItemCandidate: aiResult.actionItemCandidate,
      createdAt: new Date()
    });

    conversation.lastMessageAt = new Date();
    await repository.saveConversation(conversation);

    res.json({
      success: true,
      userMessage,
      assistantMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==========================================
// 5. CONSULTING REPORTS GENERATION & LIBRARY
// ==========================================
apiRouter.post('/analyses/:id/reports', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const analysisId = getParam(req.params.id);
    const ownerId = req.user!.uid;

    const analysis = await repository.getAnalysisById(analysisId, ownerId);
    if (!analysis || analysis.status !== 'completed') {
      res.status(400).json({ success: false, error: 'A completed business analysis is required to generate a report.' });
      return;
    }

    const business = await repository.getBusinessById(analysis.businessId, ownerId);
    if (!business) {
      res.status(404).json({ success: false, error: 'Business profile not found.' });
      return;
    }

    const existingReports = await repository.getReportsByBusiness(business.id, ownerId);
    const nextVersion = existingReports.length + 1;

    const sections: Array<{
      title: string;
      content: string;
      type: 'text' | 'table' | 'cards' | 'list';
      data?: any;
    }> = [
      {
        title: '1. Cover & Executive Overview',
        content: `Comprehensive Strategic Audit prepared for ${business.identity.businessName}. Version ${nextVersion}.0. Generated on ${new Date().toLocaleDateString()}.`,
        type: 'text'
      },
      {
        title: '2. Executive Summary',
        content: analysis.executiveSummary.overview,
        type: 'text',
        data: {
          mainFindings: analysis.executiveSummary.mainFindings,
          keyOpportunities: analysis.executiveSummary.keyOpportunities,
          priorityConcerns: analysis.executiveSummary.priorityConcerns
        }
      },
      {
        title: '3. Business Profile & Structural Overview',
        content: `Industry: ${business.identity.industry} | Stage: ${business.identity.businessStage} | Model: ${business.identity.businessModel.toUpperCase()} | Founded: ${business.identity.yearEstablished || 'N/A'}.`,
        type: 'text'
      },
      {
        title: '4. Business Model & Value Generation',
        content: analysis.businessModelAnalysis.valueGeneration,
        type: 'cards',
        data: {
          strengths: analysis.businessModelAnalysis.modelStrengths,
          weaknesses: analysis.businessModelAnalysis.modelWeaknesses,
          diversification: analysis.businessModelAnalysis.diversificationOpportunities
        }
      },
      {
        title: '5. Comprehensive SWOT Matrix',
        content: 'Systematic analysis of internal competencies and external environmental vectors.',
        type: 'table',
        data: analysis.swot
      },
      {
        title: '6. Confirmed Advantages vs Hypothesized Inefficiencies',
        content: 'Fact-checked capabilities segregated from predictive hypotheses.',
        type: 'table',
        data: analysis.prosAndCons
      },
      {
        title: '7. Marketing & Customer Acquisition Audit',
        content: analysis.marketingSalesAudit.customerAcquisitionStrategy,
        type: 'cards',
        data: {
          conversionOpportunities: analysis.marketingSalesAudit.websiteConversionOpportunities,
          leadGenWeaknesses: analysis.marketingSalesAudit.leadGenerationWeaknesses,
          funnelImprovements: analysis.marketingSalesAudit.salesFunnelImprovements
        }
      },
      {
        title: '8. Financial & Profitability Review',
        content: analysis.financialReview.revenueModelAssessment,
        type: 'cards',
        data: {
          cashFlow: analysis.financialReview.cashFlowObservations,
          marginOpportunities: analysis.financialReview.marginImprovementOpportunities,
          metricsToWatch: analysis.financialReview.metricsRequiringAttention,
          disclaimer: analysis.financialReview.disclaimer
        }
      },
      {
        title: '9. Operations, Workflow & Productivity',
        content: analysis.operationsProductivity.estimatedSavingsSummary || 'Streamlining operational friction unlocks leadership bandwidth.',
        type: 'list',
        data: {
          bottlenecks: analysis.operationsProductivity.operationalBottlenecks,
          processImprovements: analysis.operationsProductivity.processImprovements,
          automation: analysis.operationsProductivity.automationOpportunities
        }
      },
      {
        title: '10. Competitive Positioning & Market Differentiation',
        content: analysis.competitivePositioning.differentiationAssessment,
        type: 'text',
        data: {
          comparison: analysis.competitivePositioning.competitorComparison,
          strengtheningActions: analysis.competitivePositioning.strengtheningValueProposition,
          basisNotice: analysis.competitivePositioning.basisNotice
        }
      },
      {
        title: '11. Risk Analysis & Mitigation Matrix',
        content: 'Categorized enterprise exposure vectors and pre-emptive remediation procedures.',
        type: 'table',
        data: analysis.riskAnalysis
      },
      {
        title: '12. Ranked Strategic Growth Opportunities',
        content: 'Prioritized growth vectors scored by business impact, implementation effort, and execution timeframe.',
        type: 'table',
        data: analysis.growthOpportunities
      },
      {
        title: '13. Tactical 7-Day & 30-Day Execution Roadmaps',
        content: 'High-urgency immediate milestones to build operational momentum.',
        type: 'table',
        data: analysis.actionPlan.filter((a) => a.timeframe === '7_days' || a.timeframe === '30_days')
      },
      {
        title: '14. Strategic 90-Day & 6-12 Month Growth Plan',
        content: 'Longer horizon transformation projects and market authority targets.',
        type: 'table',
        data: analysis.actionPlan.filter((a) => a.timeframe === '90_days' || a.timeframe === '6_12_months')
      },
      {
        title: '15. Information Gaps, Assumptions & Limitations',
        content: 'Explicit assumptions documented to ensure analytical transparency.',
        type: 'cards',
        data: analysis.informationGaps
      },
      {
        title: '16. Final Strategic Mandates & Executive Directive',
        content: `Immediate directive for ${business.identity.businessName}: Prioritize ${analysis.actionPlan[0]?.recommendedAction || 'pipeline conversion mapping'} to secure operational runway before scaling customer acquisition.`,
        type: 'text'
      }
    ];

    const reportId = 'report_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newReport: IReport = {
      id: reportId,
      ownerId,
      businessId: business.id,
      analysisId: analysis.id,
      title: `${business.identity.businessName} Strategic Advisory Report v${nextVersion}`,
      version: nextVersion,
      businessName: business.identity.businessName,
      generatedAt: new Date(),
      executiveSummary: analysis.executiveSummary.overview,
      sections
    };

    const saved = await repository.saveReport(newReport);
    res.status(201).json({ success: true, report: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/businesses/:id/reports', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const list = await repository.getReportsByBusiness(id, req.user!.uid);
    res.json({ success: true, reports: list });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/reports/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const report = await repository.getReportById(id, req.user!.uid);
    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found or access denied.' });
      return;
    }
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==========================================
// 6. ACTION ITEMS & TASK TRACKER
// ==========================================
apiRouter.get('/businesses/:id/actions', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const items = await repository.getActionItems(id, req.user!.uid);
    res.json({ success: true, actionItems: items });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/businesses/:id/actions', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = getParam(req.params.id);
    const ownerId = req.user!.uid;
    const body = req.body;

    const id = body.id || 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const item: IActionItem = {
      id,
      ownerId,
      businessId,
      title: body.title,
      description: body.description || '',
      category: body.category || 'Strategic Task',
      priority: body.priority || 'medium',
      timeframe: body.timeframe || '30_days',
      status: body.status || 'todo',
      ownerRole: body.ownerRole,
      successMetric: body.successMetric,
      dueDate: body.dueDate,
      source: body.source || 'user_manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const saved = await repository.saveActionItem(item);
    res.status(201).json({ success: true, actionItem: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.patch('/actions/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user!.uid;
    const id = getParam(req.params.id);
    const body = req.body;
    const updated = await repository.saveActionItem({
      ...body,
      id,
      ownerId,
      updatedAt: new Date()
    });
    res.json({ success: true, actionItem: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.delete('/actions/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const success = await repository.deleteActionItem(id, req.user!.uid);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==========================================
// ==========================================
// 7. USER SETTINGS & ACCOUNT PURGE (GDPR)
// ==========================================
apiRouter.get('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await repository.getSettings(req.user!.uid);
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.patch('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updated = await repository.updateSettings(req.user!.uid, req.body);
    res.json({
      success: true,
      settings: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.delete('/account', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await repository.purgeAccount(req.user!.uid);
    res.json({ success: true, message: 'All user data, businesses, analyses, and records permanently deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
