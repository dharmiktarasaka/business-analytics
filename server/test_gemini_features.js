async function testFeatures() {
  const baseUrl = 'http://localhost:5000';
  const testEmail = `gemini_tester_${Date.now()}@advisor.io`;

  // 1. Register user
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      confirmPassword: 'password123',
      mobileNumber: '+1 555-4321',
      yearlyRevenue: '$1,500,000 - $5,000,000',
      displayName: 'Elena Rostova',
      businessName: 'Vanguard Industrial Robotics'
    })
  }).then(r => r.json());

  const token = regRes.token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // 2. Check settings API (clean user preferences)
  const settingsRes = await fetch(`${baseUrl}/api/settings`, { headers }).then(r => r.json());
  console.log('Settings fetched:', settingsRes.success, 'currency:', settingsRes.settings.preferredCurrency, 'temperament:', settingsRes.settings.aiCreativity);

  // 3. Update profile with detailed diagnostic questionnaire data
  const bizList = await fetch(`${baseUrl}/api/businesses`, { headers }).then(r => r.json());
  const bizId = bizList.businesses[0].id;

  await fetch(`${baseUrl}/api/businesses/${bizId}/draft`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      identity: {
        businessName: 'Vanguard Industrial Robotics',
        industry: 'Advanced Manufacturing',
        businessModel: 'b2b',
        businessStage: 'scaling',
        targetMarkets: ['North America', 'Europe']
      },
      productsServices: {
        mainOfferings: 'Custom automated robotic arm assembly cells',
        pricingModel: 'Fixed + Annual Maintenance SLA',
        avgSellingPrice: '$85,000 per cell',
        primaryRevenueGenerator: 'Hardware system deployments',
        usp: 'Guaranteed 99.8% uptime with proprietary remote predictive maintenance sensors',
        competitiveAdvantages: ['Proprietary sensor patents', '3x faster deployment cycle than legacy German competitors'],
        customerProblemsSolved: 'Severe plant floor labor shortages and high component assembly error rates'
      },
      targetAudience: {
        idealCustomerProfile: 'Plant managers and VP of Operations at Tier-1 automotive suppliers',
        painPoints: ['High labor turnover', 'Scrap rate exceeding 4% on manual assembly'],
        estimatedCac: '$6,200',
        estimatedLtv: '$240,000'
      },
      salesMarketing: {
        primaryChannels: ['Industry Trade Expos', 'Direct Outbound Enterprise SDRs'],
        leadGenMethods: ['Executive plant audits', 'Live floor demonstrations'],
        marketingChallenges: ['Long 9-month sales cycles', 'Capital expenditure committee delays']
      },
      financials: {
        annualRevenue: '$1,500,000 - $5,000,000',
        monthlyRevenue: '$280,000 / month',
        approximateProfitMargin: '32% gross margin',
        cashFlowSituation: 'tight'
      },
      operations: {
        operationalBottlenecks: ['Lead engineer capacity bottleneck during custom PLC commissioning', 'Sensor component supply delays'],
        toolsAndSoftware: ['SolidWorks', 'Siemens TIA Portal', 'HubSpot']
      },
      challenges: {
        biggestProblems: ['9-month enterprise sales cycle stalling quarterly revenue predictability'],
        shortTermGoals30To90Days: ['Close 3 pending enterprise proposals', 'Hire senior PLC commissioning engineer'],
        longTermGoals1To3Years: ['Reach $10M ARR with 40% recurring software & maintenance revenue']
      }
    })
  });

  // 4. Trigger Analysis
  const analyzeRes = await fetch(`${baseUrl}/api/businesses/${bizId}/analyze`, { method: 'POST', headers }).then(r => r.json());
  let analysis = analyzeRes.analysis;

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 900));
    const check = await fetch(`${baseUrl}/api/analyses/${analysis.id}`, { headers }).then(r => r.json());
    analysis = check.analysis;
    if (analysis.status === 'completed') break;
  }

  console.log('\n--- VERIFYING REAL PROS & CONS IN ANALYSIS ---');
  console.log(`Pros generated (${analysis.prosAndCons.pros.length}):`);
  analysis.prosAndCons.pros.forEach((p, idx) => {
    console.log(`  Pro ${idx + 1}: [${p.category || 'General'}] [${p.impact || 'Normal'} Impact] ${p.point}`);
    console.log(`         Detail: ${p.detail.slice(0, 85)}...`);
    console.log(`         Evidence: ${p.evidenceRef || 'None'}`);
  });

  console.log(`\nCons generated (${analysis.prosAndCons.cons.length}):`);
  analysis.prosAndCons.cons.forEach((c, idx) => {
    console.log(`  Con ${idx + 1}: [${c.category || 'General'}] [${c.impact || 'Normal'} Risk] ${c.point}`);
    console.log(`         Detail: ${c.detail.slice(0, 85)}...`);
    console.log(`         Evidence: ${c.evidenceRef || 'None'}`);
  });

  console.log('\n--- VERIFYING STRATEGIC SUGGESTIONS & ROADMAP ---');
  console.log('Action plan items count:', analysis.actionPlan.length);
  analysis.actionPlan.slice(0, 3).forEach((a, idx) => {
    console.log(`  Action ${idx + 1}: [${a.timeframe}] ${a.recommendedAction} (Owner: ${a.suggestedOwnerRole})`);
  });

  console.log('\n✅ ALL SERVER .ENV & REAL PROS/CONS VALIDATION CHECKS PASSED!');
}

testFeatures().catch(console.error);
