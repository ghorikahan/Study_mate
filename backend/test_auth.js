/**
 * StudyMate — Day 4 Authentication Test Suite
 * Tests all auth endpoints: register, login, getMe, logout, protect middleware.
 *
 * Uses an ephemeral HTTP server (no hardcoded port) and no external test runner.
 * Run with: node test_auth.js
 *
 * Tests are split into two groups:
 *   - Unit tests: validation, middleware, JWT helpers (no MongoDB required)
 *   - Integration tests: full register/login/me/logout flows (MongoDB required)
 */

'use strict';

require('dotenv').config();

const http = require('http');
const assert = require('assert');

// ─── Minimal HTTP Client ──────────────────────────────────────────────────────

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

// ─── Test Runner ─────────────────────────────────────────────────────────────

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

// ─── App Bootstrap ───────────────────────────────────────────────────────────

async function startServer() {
  const app = require('./server');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, port };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔐 StudyMate — Day 4 Authentication Tests\n');

  const { server, port } = await startServer();

  // Check MongoDB connectivity — integration tests create real users in DB
  const { getDBStatus } = require('./config/db');
  const dbStatus = await getDBStatus();
  const dbConnected = dbStatus.isConnected;

  if (dbConnected) {
    console.log(`✅ MongoDB connected to: ${dbStatus.host}/${dbStatus.databaseName}`);
  } else {
    console.warn('⚠️  MongoDB not connected — integration tests will be skipped.');
    console.warn('   Configure MONGODB_URI in backend/.env to run full test suite.\n');
  }

  // ─── Unique email per run ────────────────────────────────────────────────
  const timestamp = Date.now();
  const TEST_EMAIL = `testuser${timestamp}@studymate.dev`;
  const TEST_PASSWORD = 'SecurePass123';
  const TEST_NAME = 'Test Student';
  let validToken = null;

  // ─── UNIT TESTS: JWT Helper ──────────────────────────────────────────────

  console.log('\n🔑 JWT Helper (Unit)');

  await test('generateToken returns a JWT string', () => {
    const { generateToken } = require('./utils/jwtHelper');
    // JWT_SECRET must be set for this to work
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test_secret_for_unit_test';
      process.env.JWT_EXPIRES_IN = '1h';
    }
    const token = generateToken('507f1f77bcf86cd799439011');
    assert.strictEqual(typeof token, 'string', 'Token must be a string');
    assert.ok(token.split('.').length === 3, 'Token must have 3 JWT segments');
  });

  await test('verifyToken decodes a valid JWT correctly', () => {
    const { generateToken, verifyToken } = require('./utils/jwtHelper');
    const fakeId = '507f1f77bcf86cd799439011';
    const token = generateToken(fakeId);
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.id, fakeId, 'Decoded id should match input');
  });

  await test('verifyToken throws AppError on invalid token', () => {
    const { verifyToken } = require('./utils/jwtHelper');
    const AppError = require('./utils/appError');
    let threw = false;
    try {
      verifyToken('garbage.token.payload');
    } catch (e) {
      threw = true;
      assert.ok(e instanceof AppError, 'Should throw AppError');
      assert.strictEqual(e.statusCode, 401, 'Error status should be 401');
    }
    assert.ok(threw, 'verifyToken should have thrown');
  });

  // ─── UNIT TESTS: Validation Middleware ──────────────────────────────────

  console.log('\n📋 Validation — Registration (Unit via HTTP)');

  await test('POST /api/auth/register — missing name → 400 with name error', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: { email: 'missing@name.com', password: 'Pass1234' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.name, 'Should report name field error');
  });

  await test('POST /api/auth/register — missing email → 400 with email error', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'No Email', password: 'Pass1234' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.email, 'Should report email field error');
  });

  await test('POST /api/auth/register — invalid email format → 400 with email error', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'Bad Email', email: 'not-an-email', password: 'Pass1234' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.email, 'Should report email format error');
  });

  await test('POST /api/auth/register — password too short (<6 chars) → 400', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'Short Pass', email: 'short@pass.com', password: '123' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.password, 'Should report password length error');
  });

  await test('POST /api/auth/register — name too short (<2 chars) → 400', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'A', email: 'short@name.com', password: 'ValidPass1' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.name, 'Should report name length error');
  });

  await test('POST /api/auth/register — missing password → 400', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'No Pass', email: 'nopass@test.com' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.password, 'Should report password error');
  });

  console.log('\n📋 Validation — Login (Unit via HTTP)');

  await test('POST /api/auth/login — missing password → 400', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'test@test.com' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.password, 'Should report password error');
  });

  await test('POST /api/auth/login — invalid email format → 400', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'bad-email', password: 'Pass123' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.body.errors && r.body.errors.email, 'Should report email format error');
  });

  // ─── UNIT TESTS: Protect Middleware (no DB needed) ───────────────────────

  console.log('\n🛡️  Protect Middleware (Unit via HTTP)');

  await test('GET /api/auth/me — no token → 401', async () => {
    const r = await request(port, { method: 'GET', path: '/api/auth/me' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
    assert.strictEqual(r.body.success, false, 'success must be false');
  });

  await test('GET /api/auth/me — garbage token → 401', async () => {
    const r = await request(port, {
      method: 'GET',
      path: '/api/auth/me',
      token: 'thisisnotavalidjwttoken.garbage.payload',
    });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
    assert.strictEqual(r.body.success, false, 'success must be false');
  });

  await test('POST /api/auth/logout — no token → 401 (protect blocks)', async () => {
    const r = await request(port, { method: 'POST', path: '/api/auth/logout' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  // ─── RESPONSE FORMAT ──────────────────────────────────────────────────────

  console.log('\n📐 Response Shape (Unit)');

  await test('Error responses include { success: false, message, timestamp }', async () => {
    const r = await request(port, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'bad-email', password: 'P' },
    });
    assert.strictEqual(r.body.success, false, 'success must be false');
    assert.ok(typeof r.body.message === 'string', 'message must be string');
    assert.ok(typeof r.body.timestamp === 'string', 'timestamp must be string');
  });

  // ─── INTEGRATION TESTS (MongoDB required) ────────────────────────────────

  if (!dbConnected) {
    console.log('\n⏭️  Skipping integration tests (MongoDB not configured).\n');
  } else {
    console.log('\n🗄️  Integration Tests (MongoDB)');

    console.log('\n  Registration');

    await test('POST /api/auth/register — valid data → 201, token returned, password absent', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/auth/register',
        body: { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      assert.strictEqual(r.status, 201, `Expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
      assert.ok(r.body.success, 'success must be true');
      assert.ok(r.body.data.token, 'Token must be in data.token');
      assert.ok(r.body.data.user, 'User object must be in data.user');
      assert.strictEqual(r.body.data.user.email, TEST_EMAIL, 'Email should match');
      assert.ok(!r.body.data.user.password, 'Password must NOT be in response');
      assert.ok(!r.body.data.user.__v, '__v must NOT be in response');
    });

    await test('POST /api/auth/register — duplicate email → 409 Conflict', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/auth/register',
        body: { name: 'Another User', email: TEST_EMAIL, password: 'AnotherPass1' },
      });
      assert.strictEqual(r.status, 409, `Expected 409, got ${r.status}: ${JSON.stringify(r.body)}`);
      assert.strictEqual(r.body.success, false, 'success must be false');
    });

    console.log('\n  Login');

    await test('POST /api/auth/login — valid credentials → 200, token returned', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/auth/login',
        body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
      assert.ok(r.body.success, 'success must be true');
      assert.ok(r.body.data.token, 'Token must be present');
      assert.ok(!r.body.data.user.password, 'Password must NOT be in response');
      validToken = r.body.data.token;
    });

    await test('POST /api/auth/login — wrong password → 401 (generic message)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/auth/login',
        body: { email: TEST_EMAIL, password: 'WrongPassword!' },
      });
      assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
      assert.strictEqual(r.body.success, false, 'success must be false');
      assert.ok(r.body.message.includes('Invalid email or password'), 'Should use generic message');
    });

    await test('POST /api/auth/login — non-existent email → 401 (same generic message)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/auth/login',
        body: { email: 'doesnotexist@nowhere.com', password: 'Pass123' },
      });
      assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
      assert.strictEqual(r.body.success, false, 'success must be false');
      assert.ok(r.body.message.includes('Invalid email or password'), 'Should use same generic message');
    });

    await test('POST /api/auth/login — UPPERCASE email still authenticates (case insensitive)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/auth/login',
        body: { email: TEST_EMAIL.toUpperCase(), password: TEST_PASSWORD },
      });
      assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
      assert.ok(r.body.data.token, 'Token must be present regardless of email case');
    });

    console.log('\n  GET /api/auth/me (Protected)');

    await test('GET /api/auth/me — valid token → 200, user data returned, no password', async () => {
      assert.ok(validToken, 'Need a valid token from login test');
      const r = await request(port, { method: 'GET', path: '/api/auth/me', token: validToken });
      assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
      assert.ok(r.body.success, 'success must be true');
      assert.ok(r.body.data.user, 'User data should be in data.user');
      assert.strictEqual(r.body.data.user.email, TEST_EMAIL, 'Email should match registered email');
      assert.ok(!r.body.data.user.password, 'Password must NOT be in response');
    });

    await test('All success responses include { success, message, data, timestamp }', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/auth/login',
        body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      assert.ok(typeof r.body.success === 'boolean', 'success must be boolean');
      assert.ok(typeof r.body.message === 'string', 'message must be string');
      assert.ok('data' in r.body, 'data key must be present');
      assert.ok(typeof r.body.timestamp === 'string', 'timestamp must be string');
    });

    console.log('\n  Logout');

    await test('POST /api/auth/logout — valid token → 200', async () => {
      assert.ok(validToken, 'Need a valid token from login test');
      const r = await request(port, { method: 'POST', path: '/api/auth/logout', token: validToken });
      assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
      assert.ok(r.body.success, 'success must be true');
      assert.ok(r.body.message.includes('Logged out'), 'Message should confirm logout');
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  server.close();

  const integration = dbConnected ? ' (all tests including integration)' : ' (unit tests only — configure MONGODB_URI for integration tests)';
  console.log('\n' + '─'.repeat(60));
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`Mode: ${integration}`);

  if (failed > 0) {
    console.error('\n⚠️  Some tests failed — review errors above.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 All authentication tests passed!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥 Test runner crashed:', err.message);
  process.exit(1);
});
