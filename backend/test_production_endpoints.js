/**
 * StudyMate Production Endpoint Verification Script
 *
 * Usage:
 *   node test_production_endpoints.js [BASE_URL]
 *
 * Example:
 *   node test_production_endpoints.js http://localhost:5000
 *   node test_production_endpoints.js https://studymate-api.onrender.com
 */

const targetUrl = (process.argv[2] || process.env.TARGET_URL || 'http://localhost:5000').replace(/\/+$/, '');
let effectiveUrl = targetUrl;
let serverInstance = null;

console.log('═'.repeat(65));
console.log('🌐 StudyMate Live Production Endpoint Verifier');
console.log(`🎯 Target API Base URL: ${targetUrl}`);
console.log('═'.repeat(65));

const results = [];
let passCount = 0;
let failCount = 0;

const assert = (title, condition, detail = '') => {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passCount++;
    results.push({ title, status: 'PASS' });
  } else {
    console.error(`  ❌ [FAIL] ${title} ${detail ? `(${detail})` : ''}`);
    failCount++;
    results.push({ title, status: 'FAIL', detail });
  }
};

const makeRequest = async (path, options = {}) => {
  const url = `${effectiveUrl}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    const duration = Date.now() - start;
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data, duration };
  } catch (err) {
    return { status: 0, ok: false, error: err.message, duration: Date.now() - start };
  }
};

const runProductionChecks = async () => {
  if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
    try {
      const probe = await fetch(`${targetUrl}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (!probe.ok) throw new Error('Not healthy');
    } catch {
      const app = require('./server');
      await new Promise((resolve) => {
        serverInstance = app.listen(0, '127.0.0.1', () => {
          const port = serverInstance.address().port;
          effectiveUrl = `http://127.0.0.1:${port}`;
          console.log(`  ℹ️ Spawned in-memory verification server on ${effectiveUrl}`);
          resolve();
        });
      });
    }
  }
  console.log('\n🔍 Phase 1: Core Health & Discovery Endpoints');

  // 1. Root discovery endpoint
  const rootRes = await makeRequest('/');
  assert('GET / returns HTTP 200 OK', rootRes.status === 200, `Got ${rootRes.status}`);
  assert('GET / advertises app metadata', rootRes.data?.data?.app?.includes('StudyMate'), JSON.stringify(rootRes.data));
  assert('GET / indicates operational status', rootRes.data?.data?.status === 'operational');

  // 2. Health check endpoint (Render health check path)
  const healthRes = await makeRequest('/api/health');
  assert('GET /api/health returns HTTP 200 OK', healthRes.status === 200, `Got ${healthRes.status}`);
  assert('GET /api/health indicates status: healthy', healthRes.data?.data?.status === 'healthy');
  assert('GET /api/health reports server uptime', typeof healthRes.data?.data?.uptimeSeconds === 'number');

  // 3. Database status endpoint
  const dbRes = await makeRequest('/api/database-status');
  assert('GET /api/database-status returns HTTP 200 OK', dbRes.status === 200, `Got ${dbRes.status}`);
  assert('GET /api/database-status returns database state object', typeof dbRes.data?.data?.isConnected === 'boolean');
  assert('GET /api/database-status lists registered schemas', Array.isArray(dbRes.data?.data?.registeredModels));

  console.log('\n🔒 Phase 2: Route Protection & 404 Resilience');

  // 4. Missing route returns 404 with standardized error
  const notFoundRes = await makeRequest('/api/non-existent-endpoint-xyz');
  assert('GET /api/non-existent returns HTTP 404', notFoundRes.status === 404, `Got ${notFoundRes.status}`);
  assert('404 response follows standardized error format', notFoundRes.data?.success === false);

  // 5. Protected endpoints reject unauthenticated requests with 401
  const protectedRoutes = [
    { method: 'GET', path: '/api/dashboard/summary' },
    { method: 'GET', path: '/api/study-plans' },
    { method: 'GET', path: '/api/tasks' },
    { method: 'GET', path: '/api/timetable' },
    { method: 'GET', path: '/api/exams' },
    { method: 'GET', path: '/api/study-sessions/stats' },
    { method: 'GET', path: '/api/analytics/overview' },
    { method: 'GET', path: '/api/users/profile' },
    { method: 'GET', path: '/api/notifications' },
  ];

  for (const route of protectedRoutes) {
    const res = await makeRequest(route.path, { method: route.method });
    assert(`${route.method} ${route.path} enforces auth (HTTP 401)`, res.status === 401, `Got ${res.status}`);
  }

  console.log('\n🛡️ Phase 3: CORS & Response Headers');
  const corsProbe = await makeRequest('/', { headers: { Origin: 'http://localhost:8081' } });
  assert('GET / responds with CORS header when Origin header is sent', corsProbe.headers?.get('access-control-allow-origin') !== null);

  console.log('\n' + '═'.repeat(65));
  console.log(`Production Test Results for ${targetUrl}:`);
  console.log(`Total: ${passCount + failCount} | ✅ Passed: ${passCount} | ❌ Failed: ${failCount}`);
  console.log('═'.repeat(65));

  if (serverInstance) {
    serverInstance.close();
  }

  if (failCount > 0) {
    process.exit(1);
  }
};

runProductionChecks();
