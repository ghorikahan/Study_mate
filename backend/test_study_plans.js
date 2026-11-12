/**
 * StudyMate — Day 7 Study Planner CRUD & Security Test Suite
 * Tests every CRUD operation: Create, Read, Update, Delete, Filters, and Ownership Enforcement.
 *
 * Run with: node test_study_plans.js
 */

'use strict';

require('dotenv').config();

const http = require('http');
const assert = require('assert');

function request(port, { method = 'GET', path = '/', body = null, token = null } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({ hostname: '127.0.0.1', port, method, path, headers }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ✅ ${name}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  ❌ ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    });
}

async function startServer() {
  const app = require('./server');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, port };
}

async function main() {
  console.log('\n📖 StudyMate — Day 7 Study Planner CRUD & Security Tests\n');

  const { server, port } = await startServer();

  const { getDBStatus } = require('./config/db');
  const dbStatus = await getDBStatus();
  const dbConnected = dbStatus.isConnected;

  console.log('🛡️  Route Protection & Validation (Unit)');

  await test('POST /api/study-plans — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'POST', path: '/api/study-plans', body: { subject: 'CS' } });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
    assert.strictEqual(r.body.success, false);
  });

  await test('GET /api/study-plans — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'GET', path: '/api/study-plans' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  await test('GET /api/study-plans/:id — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'GET', path: '/api/study-plans/507f1f77bcf86cd799439011' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  await test('PUT /api/study-plans/:id — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'PUT', path: '/api/study-plans/507f1f77bcf86cd799439011', body: {} });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  await test('DELETE /api/study-plans/:id — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'DELETE', path: '/api/study-plans/507f1f77bcf86cd799439011' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  if (!dbConnected) {
    console.log('\n⏭️  Skipping database integration tests (MongoDB not configured).');
  } else {
    console.log('\n🗄️  CRUD Operations & Ownership Enforcement (Integration)');

    const timestamp = Date.now();

    // 1. Register User 1
    const user1Res = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Scholar One',
        email: `scholar1_${timestamp}@studymate.dev`,
        password: 'Password123',
      },
    });
    assert.strictEqual(user1Res.status, 201, 'User 1 registered');
    const token1 = user1Res.body.data.token;

    // 2. Register User 2 (to test ownership protection)
    const user2Res = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Scholar Two',
        email: `scholar2_${timestamp}@studymate.dev`,
        password: 'Password123',
      },
    });
    assert.strictEqual(user2Res.status, 201, 'User 2 registered');
    const token2 = user2Res.body.data.token;

    // ─── VALIDATION ──────────────────────────────────────────────────────────
    console.log('\n  Input Validation');

    await test('POST /api/study-plans — rejects missing subject (400)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/study-plans',
        token: token1,
        body: { topic: 'Trees' },
      });
      assert.strictEqual(r.status, 400);
      assert.ok(r.body.message.includes('Subject is required'));
    });

    await test('POST /api/study-plans — rejects missing topic (400)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/study-plans',
        token: token1,
        body: { subject: 'Computer Science' },
      });
      assert.strictEqual(r.status, 400);
      assert.ok(r.body.message.includes('Topic/Title is required'));
    });

    await test('POST /api/study-plans — rejects duration < 5 mins (400)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/study-plans',
        token: token1,
        body: { subject: 'CS', topic: 'Algorithms', duration: 2 },
      });
      assert.strictEqual(r.status, 400);
      assert.ok(r.body.message.includes('Duration must be at least 5 minutes'));
    });

    // ─── CREATE ──────────────────────────────────────────────────────────────
    console.log('\n  Create (C in CRUD)');

    let createdPlanId = null;
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1); // Tomorrow

    await test('POST /api/study-plans — creates plan with subject, topic, date, startTime, duration, priority', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/study-plans',
        token: token1,
        body: {
          subject: 'Computer Networks',
          topic: 'TCP/IP & OSI Model',
          date: testDate.toISOString(),
          startTime: '10:00 AM',
          duration: 90,
          priority: 'high',
          description: 'Study 7 layers and packet headers',
        },
      });

      assert.strictEqual(r.status, 201, `Expected 201, got ${r.status}`);
      assert.strictEqual(r.body.success, true);
      assert.ok(r.body.data.studyPlan);

      const p = r.body.data.studyPlan;
      assert.strictEqual(p.subject, 'Computer Networks');
      assert.strictEqual(p.topic, 'TCP/IP & OSI Model');
      assert.strictEqual(p.startTime, '10:00 AM');
      assert.strictEqual(p.duration, 90);
      assert.strictEqual(p.priority, 'high');
      assert.strictEqual(p.status, 'active');

      createdPlanId = p._id;
    });

    // ─── READ ────────────────────────────────────────────────────────────────
    console.log('\n  Read & Filtering (R in CRUD)');

    await test('GET /api/study-plans — lists User 1 study plans and distinct subjects', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/study-plans',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.success, true);
      assert.ok(Array.isArray(r.body.data.studyPlans));
      assert.ok(r.body.data.studyPlans.some((p) => p._id === createdPlanId));
      assert.ok(r.body.data.subjects.includes('Computer Networks'));
    });

    await test('GET /api/study-plans?subject=Computer Networks — filters by subject', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/study-plans?subject=Computer Networks',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.ok(r.body.data.studyPlans.length >= 1);
      assert.strictEqual(r.body.data.studyPlans[0].subject, 'Computer Networks');
    });

    await test('GET /api/study-plans?subject=NonExistentSubject — returns 0 results', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/study-plans?subject=NonExistentSubject',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.data.studyPlans.length, 0);
    });

    await test('GET /api/study-plans?priority=high — filters by priority', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/study-plans?priority=high',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.ok(r.body.data.studyPlans.every((p) => p.priority === 'high'));
    });

    await test('GET /api/study-plans/:id — returns specific plan by ID for User 1', async () => {
      const r = await request(port, {
        method: 'GET',
        path: `/api/study-plans/${createdPlanId}`,
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.data.studyPlan._id, createdPlanId);
      assert.strictEqual(r.body.data.studyPlan.topic, 'TCP/IP & OSI Model');
    });

    // ─── OWNERSHIP ENFORCEMENT ───────────────────────────────────────────────
    console.log('\n  Ownership Security');

    await test('GET /api/study-plans/:id — User 2 CANNOT read User 1 plan (returns 404)', async () => {
      const r = await request(port, {
        method: 'GET',
        path: `/api/study-plans/${createdPlanId}`,
        token: token2, // User 2!
      });

      assert.strictEqual(r.status, 404, `User 2 should get 404, got ${r.status}`);
      assert.strictEqual(r.body.success, false);
    });

    await test('GET /api/study-plans — User 2 sees 0 plans (isolated user data)', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/study-plans',
        token: token2,
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.data.total, 0, 'User 2 has 0 plans');
    });

    // ─── UPDATE ──────────────────────────────────────────────────────────────
    console.log('\n  Update (U in CRUD)');

    await test('PUT /api/study-plans/:id — User 2 CANNOT update User 1 plan (returns 404)', async () => {
      const r = await request(port, {
        method: 'PUT',
        path: `/api/study-plans/${createdPlanId}`,
        token: token2, // User 2!
        body: { topic: 'Hacked Topic' },
      });

      assert.strictEqual(r.status, 404);
      assert.strictEqual(r.body.success, false);
    });

    await test('PUT /api/study-plans/:id — User 1 updates duration, topic, and priority', async () => {
      const r = await request(port, {
        method: 'PUT',
        path: `/api/study-plans/${createdPlanId}`,
        token: token1,
        body: {
          topic: 'Advanced TCP Congestion Control',
          duration: 120,
          priority: 'urgent',
        },
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.data.studyPlan.topic, 'Advanced TCP Congestion Control');
      assert.strictEqual(r.body.data.studyPlan.duration, 120);
      assert.strictEqual(r.body.data.studyPlan.priority, 'urgent');
    });

    await test('PATCH /api/study-plans/:id/status — User 1 toggles status to completed', async () => {
      const r = await request(port, {
        method: 'PATCH',
        path: `/api/study-plans/${createdPlanId}/status`,
        token: token1,
        body: { status: 'completed' },
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.data.studyPlan.status, 'completed');
    });

    // ─── DELETE ──────────────────────────────────────────────────────────────
    console.log('\n  Delete (D in CRUD)');

    await test('DELETE /api/study-plans/:id — User 2 CANNOT delete User 1 plan (returns 404)', async () => {
      const r = await request(port, {
        method: 'DELETE',
        path: `/api/study-plans/${createdPlanId}`,
        token: token2, // User 2!
      });

      assert.strictEqual(r.status, 404);
      assert.strictEqual(r.body.success, false);
    });

    await test('DELETE /api/study-plans/:id — User 1 deletes their plan', async () => {
      const r = await request(port, {
        method: 'DELETE',
        path: `/api/study-plans/${createdPlanId}`,
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.success, true);
    });

    await test('GET /api/study-plans/:id — deleted plan is no longer found (returns 404)', async () => {
      const r = await request(port, {
        method: 'GET',
        path: `/api/study-plans/${createdPlanId}`,
        token: token1,
      });

      assert.strictEqual(r.status, 404);
    });
  }

  server.close();

  console.log('\n' + '─'.repeat(55));
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All Study Planner CRUD & Security tests passed!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥 Test runner crashed:', err.message);
  process.exit(1);
});

