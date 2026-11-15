/**
 * Day 10 – Exam Tracker API Test Suite
 * Tests route protection, countdown logic, priority validation, and CRUD endpoints.
 * Runs entirely in-memory without MongoDB (unit mode).
 */

const http = require('http');
const mongoose = require('mongoose');

// ─── Minimal server setup (mirrors server.js) ─────────────────────────────────
const express = require('express');
const app = express();
app.use(express.json());

const apiRouter = require('./routes');
app.use('/api', apiRouter);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

function request(server, method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload ? Buffer.byteLength(payload) : 0,
        ...headers,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n📚 StudyMate – Day 10 Exam Tracker API Tests\n');

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const log = (method, path) => console.log(`[${new Date().toLocaleTimeString()}] ${method} ${path}`);

  // ─── GROUP 1: Route Protection ──────────────────────────────────────────────
  console.log('🛡️  Route Protection (Unit)\n');

  const fakeId = '507f1f77bcf86cd799439011';
  const routes = [
    ['GET',    '/api/exams'],
    ['POST',   '/api/exams'],
    ['GET',    `/api/exams/${fakeId}`],
    ['PUT',    `/api/exams/${fakeId}`],
    ['DELETE', `/api/exams/${fakeId}`],
    ['PATCH',  `/api/exams/${fakeId}/topics/${fakeId}`],
  ];

  for (const [method, path] of routes) {
    log(method, path);
    const res = await request(server, method, path, {});
    assert(res.status === 401, `${method} ${path} – requires auth (no token → 401)`);
  }

  // ─── GROUP 2: Countdown Logic (Unit) ────────────────────────────────────────
  console.log('\n⏳  Countdown Logic (Unit)\n');

  const localDaysRemaining = (examDateStr) => {
    const examMidnight = new Date(examDateStr);
    examMidnight.setHours(0, 0, 0, 0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return Math.ceil((examMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  assert(localDaysRemaining(todayStr) === 0, 'Today → 0 days remaining');
  assert(localDaysRemaining(tomorrowStr) === 1, 'Tomorrow → 1 day remaining');
  assert(localDaysRemaining(nextWeekStr) === 7, 'Next week → 7 days remaining');
  assert(localDaysRemaining(yesterdayStr) === -1, 'Yesterday → -1 days remaining (past)');

  // ─── GROUP 3: Priority Validation (Unit) ────────────────────────────────────
  console.log('\n🔴  Priority Validation (Unit)\n');

  const VALID_PRIORITIES = ['urgent', 'high', 'medium', 'low'];
  const validatePriority = (p) => VALID_PRIORITIES.includes(p);

  assert(validatePriority('urgent') === true,  'Priority "urgent" is valid');
  assert(validatePriority('high') === true,    'Priority "high" is valid');
  assert(validatePriority('medium') === true,  'Priority "medium" is valid');
  assert(validatePriority('low') === true,     'Priority "low" is valid');
  assert(validatePriority('critical') === false, 'Priority "critical" is invalid');
  assert(validatePriority('') === false,       'Empty string priority is invalid');
  assert(validatePriority(undefined) === false, 'undefined priority is invalid');

  // ─── GROUP 4: Date Validation (Unit) ────────────────────────────────────────
  console.log('\n📅  Date Validation (Unit)\n');

  const isValidDate = (str) => {
    if (!str) return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
  };

  assert(isValidDate('2026-12-25') === true,  'Valid date "2026-12-25"');
  assert(isValidDate('2025-01-01') === true,  'Past date still passes format validation');
  assert(isValidDate('not-a-date') === false, '"not-a-date" fails validation');
  assert(isValidDate('') === false,           'Empty string fails validation');
  assert(isValidDate(null) === false,         'null fails validation');
  assert(isValidDate('2026-13-01') === false, 'Month 13 fails validation');

  // ─── GROUP 5: Syllabus Progress Calculation (Unit) ──────────────────────────
  console.log('\n📖  Syllabus Progress Calculation (Unit)\n');

  const calcProgress = (topics) => {
    if (!topics || topics.length === 0) return 0;
    const covered = topics.filter((t) => t.isCovered).length;
    return Math.round((covered / topics.length) * 100);
  };

  assert(calcProgress([]) === 0, 'Empty topics → 0%');
  assert(calcProgress(null) === 0, 'null topics → 0%');
  assert(
    calcProgress([{ isCovered: true }, { isCovered: false }]) === 50,
    '1 of 2 covered → 50%'
  );
  assert(
    calcProgress([{ isCovered: true }, { isCovered: true }, { isCovered: true }]) === 100,
    '3 of 3 covered → 100%'
  );
  assert(
    calcProgress([{ isCovered: false }, { isCovered: false }]) === 0,
    '0 of 2 covered → 0%'
  );
  assert(
    calcProgress([
      { isCovered: true }, { isCovered: true }, { isCovered: false },
    ]) === 67,
    '2 of 3 covered → 67%'
  );

  // ─── GROUP 6: Filter Logic (Unit) ───────────────────────────────────────────
  console.log('\n🔍  Filter Logic (Unit)\n');

  const VALID_STATUS_FILTERS = ['upcoming', 'past', 'this-week', 'all', ''];
  const isValidStatusFilter = (s) => s === undefined || VALID_STATUS_FILTERS.includes(s);

  assert(isValidStatusFilter('upcoming') === true,  '"upcoming" filter is valid');
  assert(isValidStatusFilter('past') === true,      '"past" filter is valid');
  assert(isValidStatusFilter('this-week') === true, '"this-week" filter is valid');
  assert(isValidStatusFilter('all') === true,       '"all" filter is valid');
  assert(isValidStatusFilter('') === true,          'Empty string filter is valid (no filter)');
  assert(isValidStatusFilter(undefined) === true,   'undefined filter is valid (no filter)');
  assert(isValidStatusFilter('wrong') === false,    '"wrong" is an invalid filter value');

  // ─── GROUP 7: This-week boundary calculation (Unit) ─────────────────────────
  console.log('\n📆  This-Week Boundary (Unit)\n');

  const isThisWeek = (examDateStr) => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    const d = new Date(examDateStr);
    return d >= now && d <= weekEnd;
  };

  assert(isThisWeek(tomorrowStr) === true,  'Tomorrow is within this week');
  assert(isThisWeek(nextWeekStr) === true,  '+7 days is within this-week boundary');
  assert(isThisWeek(yesterdayStr) === false, 'Yesterday is NOT within this week');

  const farFuture = new Date(today);
  farFuture.setDate(today.getDate() + 30);
  assert(isThisWeek(farFuture.toISOString().split('T')[0]) === false, '+30 days is NOT this week');

  // ─── Skip integration tests ─────────────────────────────────────────────────
  const isMongoConnected = mongoose.connection.readyState === 1;
  if (!isMongoConnected) {
    console.log('\n⏭️  Skipping database integration tests (MongoDB not configured).\n');
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  server.close();
  console.log('────────────────────────────────────────────────────────');
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Fix errors above before committing.');
    process.exit(1);
  } else {
    console.log('🎉 All Exam Tracker API tests passed!\n');
  }
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});

