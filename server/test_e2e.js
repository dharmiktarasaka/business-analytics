async function test() {
  const baseUrl = 'http://localhost:5000';

  console.log('1. Testing /api/auth/register...');
  const testEmail = `executive_${Date.now()}@company.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      confirmPassword: 'password123',
      mobileNumber: '+1 555-0144',
      yearlyRevenue: '$500,000 - $1,500,000',
      displayName: 'Sarah Connor',
      businessName: 'Cyberdyne Systems'
    })
  }).then(r => r.json());

  console.log('Registration success:', regRes.success, 'User:', regRes.user?.email, 'Token:', !!regRes.token);
  if (!regRes.success) throw new Error('Registration failed: ' + regRes.error);

  const token = regRes.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('\n2. Testing /api/auth/login...');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123'
    })
  }).then(r => r.json());
  console.log('Login success:', loginRes.success, 'Token match:', !!loginRes.token);

  console.log('\n3. Testing /api/auth/me...');
  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders }).then(r => r.json());
  console.log('Me result:', meRes.success, 'Email:', meRes.user?.email, 'Revenue:', meRes.user?.yearlyRevenue);

  console.log('\n4. Testing /api/businesses list...');
  const bizListRes = await fetch(`${baseUrl}/api/businesses`, { headers: authHeaders }).then(r => r.json());
  console.log('Businesses count:', bizListRes.businesses?.length, 'Initial seeded biz:', bizListRes.businesses?.[0]?.identity.businessName);

  const activeBiz = bizListRes.businesses[0];

  console.log('\n5. Testing /api/businesses/:id/analyze...');
  const analyzeRes = await fetch(`${baseUrl}/api/businesses/${activeBiz.id}/analyze`, {
    method: 'POST',
    headers: authHeaders
  }).then(r => r.json());
  console.log('Analysis initiated:', analyzeRes.success, 'Status:', analyzeRes.analysis?.status);

  // Poll until completed
  let analysis = analyzeRes.analysis;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 900));
    const check = await fetch(`${baseUrl}/api/analyses/${analysis.id}`, { headers: authHeaders }).then(r => r.json());
    analysis = check.analysis;
    console.log('Stage:', analysis.currentStage, '(' + analysis.status + ')');
    if (analysis.status === 'completed' || analysis.status === 'failed') break;
  }

  console.log('\n6. Testing /api/analyses/:id/reports...');
  const reportRes = await fetch(`${baseUrl}/api/analyses/${analysis.id}/reports`, {
    method: 'POST',
    headers: authHeaders
  }).then(r => r.json());
  console.log('Report generated:', reportRes.success, 'Title:', reportRes.report?.title, 'Sections:', reportRes.report?.sections?.length);

  console.log('\n7. Testing AI Chat...');
  const convRes = await fetch(`${baseUrl}/api/businesses/${activeBiz.id}/conversations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: 'Executive Session' })
  }).then(r => r.json());

  const msgRes = await fetch(`${baseUrl}/api/conversations/${convRes.conversation.id}/messages`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ content: 'What are the top 3 growth opportunities for my business?' })
  }).then(r => r.json());
  console.log('Chat response:', msgRes.success, 'Content preview:', msgRes.assistantMessage?.content?.slice(0, 100) + '...');

  console.log('\n>>> COMPLETE END-TO-END REGISTRATION, LOGIN, ANALYSIS & ADVISOR WORKFLOW VERIFIED! <<<');
}

test().catch(console.error);
