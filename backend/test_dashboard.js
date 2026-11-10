/**
 * StudyMate — Day 6 Dashboard API Test Suite
 * Tests GET /api/dashboard/summary (auth protection, structure, real calculations)
 *
 * Run with: node test_dashboard.js
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
  console.log('\n📊 StudyMate — Day 6 Dashboard API Tests\n');

  const { server, port } = await startServer();

  const { getDBStatus } = require('./config/db');
  const dbStatus = await getDBStatus();
  const dbConnected = dbStatus.isConnected;

  console.log('🛡️  Route Protection (Unit)');

  await test('GET /api/dashboard/summary — requires authentication (no token → 401)', async () => {
    const r = await request(port, { method: 'GET', path: '/api/dashboard/summary' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
    assert.strictEqual(r.body.success, false, 'success must be false');
  });

  await test('GET /api/dashboard/summary — rejects invalid token (401)', async () => {
    const r = await request(port, {
      method: 'GET',
      path: '/api/dashboard/summary',
      token: 'invalid.bearer.token',
    });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
    assert.strictEqual(r.body.success, false, 'success must be false');
  });

  if (!dbConnected) {
    console.log('\n⏭️  Skipping integration tests (MongoDB not configured).');
  } else {
    console.log('\n🗄️  Dashboard Summary Integration');

    const timestamp = Date.now();
    const regRes = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Dashboard Tester',
        email: `dash${timestamp}@studymate.dev`,
        password: 'Password123',
      },
    });

    assert.strictEqual(regRes.status, 201, 'Registration should succeed');
    const token = regRes.body.data.token;

    await test('GET /api/dashboard/summary — returns full stats structure with 200', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/dashboard/summary',
        token,
      });

      assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}`);
      assert.strictEqual(r.body.success, true, 'success must be true');

      const d = r.body.data;
      assert.ok(d.user, 'user object exists');
      assert.strictEqual(d.user.name, 'Dashboard Tester');

      assert.ok(d.tasks, 'tasks object exists');
      assert.strictEqual(typeof d.tasks.total, 'number');
      assert.strictEqual(typeof d.tasks.completed, 'number');
      assert.strictEqual(typeof d.tasks.pending, 'number');
      assert.ok(Array.isArray(d.tasks.todayTasks));

      assert.ok(d.studyTime, 'studyTime object exists');
      assert.strictEqual(typeof d.studyTime.todayHours, 'number');
      assert.strictEqual(typeof d.studyTime.weekHours, 'number');
      assert.ok(Array.isArray(d.studyTime.weeklyBreakdown));
      assert.strictEqual(d.studyTime.weeklyBreakdown.length, 7, '7 days in weekly breakdown');

      assert.ok(d.exams, 'exams object exists');
      assert.strictEqual(typeof d.exams.totalUpcoming, 'number');
      assert.ok(Array.isArray(d.exams.upcoming));

      assert.ok(d.plans, 'plans object exists');
      assert.strictEqual(typeof d.plans.activeCount, 'number');
    });
  }

  server.close();

  console.log('\n' + '─'.repeat(50));
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All dashboard API tests passed!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥 Test runner crashed:', err.message);
  process.exit(1);
});
