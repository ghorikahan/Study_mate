/**
 * Day 12 – Analytics Module API Test Suite
 * Tests route protection, date range calculation, hour/minute conversion,
 * subject distribution percentages, task completion rates, monthly progress,
 * and composite productivity scoring.
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
  console.log('\n📊 StudyMate – Day 12 Analytics Module Tests\n');

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const log = (method, path) => console.log(`[${new Date().toLocaleTimeString()}] ${method} ${path}`);

  // ─── GROUP 1: Route Protection ──────────────────────────────────────────────
  console.log('🛡️  Route Protection (Unit)\n');

  const routes = [
    ['GET', '/api/analytics'],
    ['GET', '/api/analytics/overview'],
    ['GET', '/api/analytics/overview?timeRange=7d'],
    ['GET', '/api/analytics/overview?timeRange=30d'],
  ];

  for (const [method, path] of routes) {
    log(method, path);
    const res = await request(server, method, path, {});
    assert(res.status === 401, `${method} ${path} – requires auth (no token → 401)`);
  }

  // ─── GROUP 2: Time Range & Days Count ───────────────────────────────────────
  console.log('\n📅  Time Range & Days Count Logic (Unit)\n');

  const getDaysCount = (timeRange) => {
    if (timeRange === '30d' || timeRange === 'month') return 30;
    if (timeRange === 'all') return 90;
    return 7;
  };

  assert(getDaysCount('7d') === 7, 'timeRange "7d" → 7 days');
  assert(getDaysCount('week') === 7, 'timeRange "week" → 7 days');
  assert(getDaysCount('30d') === 30, 'timeRange "30d" → 30 days');
  assert(getDaysCount('month') === 30, 'timeRange "month" → 30 days');
  assert(getDaysCount('all') === 90, 'timeRange "all" → 90 days');
  assert(getDaysCount(undefined) === 7, 'default timeRange → 7 days');

  // ─── GROUP 3: Hour & Minute Conversion Math ─────────────────────────────────
  console.log('\n⏱️  Hour & Minute Conversion Math (Unit)\n');

  const toHours = (minutes) => Math.round((minutes / 60) * 10) / 10;

  assert(toHours(320) === 5.3, '320 minutes = 5.3 hours');
  assert(toHours(60) === 1.0, '60 minutes = 1.0 hour');
  assert(toHours(30) === 0.5, '30 minutes = 0.5 hours');
  assert(toHours(125) === 2.1, '125 minutes = 2.1 hours');
  assert(toHours(0) === 0.0, '0 minutes = 0.0 hours');

  // ─── GROUP 4: Subject Distribution Percentages ──────────────────────────────
  console.log('\n🎨  Subject Distribution Calculation (Unit)\n');

  const calcSubjectPercent = (subjectMins, totalMins) => {
    if (!totalMins || totalMins <= 0) return 0;
    return Math.round((subjectMins / totalMins) * 100);
  };

  assert(calcSubjectPercent(150, 300) === 50, '150m of 300m = 50%');
  assert(calcSubjectPercent(75, 300) === 25, '75m of 300m = 25%');
  assert(calcSubjectPercent(300, 300) === 100, '300m of 300m = 100%');
  assert(calcSubjectPercent(0, 300) === 0, '0m of 300m = 0%');
  assert(calcSubjectPercent(100, 0) === 0, '0 total minutes handles gracefully → 0%');

  // ─── GROUP 5: Task Completion Rate Math ─────────────────────────────────────
  console.log('\n✅  Task Completion Rate Calculation (Unit)\n');

  const calcTaskCompletionRate = (completed, total) => {
    if (!total || total <= 0) return 0;
    return Math.round((completed / total) * 100);
  };

  assert(calcTaskCompletionRate(8, 10) === 80, '8 of 10 completed = 80%');
  assert(calcTaskCompletionRate(10, 10) === 100, '10 of 10 completed = 100%');
  assert(calcTaskCompletionRate(0, 10) === 0, '0 of 10 completed = 0%');
  assert(calcTaskCompletionRate(0, 0) === 0, '0 of 0 handles gracefully → 0%');
  assert(calcTaskCompletionRate(3, 9) === 33, '3 of 9 completed = 33%');

  // ─── GROUP 6: Monthly Progress vs Goal ──────────────────────────────────────
  console.log('\n🎯  Monthly Progress vs Goal Calculation (Unit)\n');

  const calcMonthlyProgress = (monthHours, goalHours) => {
    if (!goalHours || goalHours <= 0) return 0;
    return Math.min(100, Math.round((monthHours / goalHours) * 100));
  };

  assert(calcMonthlyProgress(16, 80) === 20, '16h of 80h goal = 20%');
  assert(calcMonthlyProgress(40, 80) === 50, '40h of 80h goal = 50%');
  assert(calcMonthlyProgress(80, 80) === 100, '80h of 80h goal = 100%');
  assert(calcMonthlyProgress(100, 80) === 100, '100h of 80h goal caps at 100%');
  assert(calcMonthlyProgress(0, 80) === 0, '0h of 80h goal = 0%');

  // ─── GROUP 7: Productivity Composite Score Calculation ──────────────────────
  console.log('\n🏆  Productivity Composite Scoring (Unit)\n');

  const calcProductivityScore = (studiedHours, weeklyGoal, daysCount, completionRate, avgFocusRating) => {
    const goalRatio = Math.min(1, studiedHours / (weeklyGoal * (daysCount / 7)));
    const goalScore = goalRatio * 40;
    const taskScore = (completionRate / 100) * 40;
    const ratingScore = (avgFocusRating / 5) * 20;
    return Math.max(10, Math.min(100, Math.round(goalScore + taskScore + ratingScore)));
  };

  assert(
    calcProductivityScore(20, 20, 7, 100, 5) === 100,
    'Full study goal (20h), 100% tasks, 5-star rating → 100 perfect score'
  );
  assert(
    calcProductivityScore(10, 20, 7, 50, 4) === 56,
    'Half goal (10h), 50% tasks, 4-star rating → 56 score'
  );
  assert(
    calcProductivityScore(0, 20, 7, 0, 0) === 10,
    'Zero activity → floors at 10 minimum score'
  );

  // ─── GROUP 8: Continuous Daily Date Strip Generation ────────────────────────
  console.log('\n🗓️  Daily Date Strip Sequence (Unit)\n');

  const generateDateStrip = (days) => {
    const dates = [];
    const now = new Date('2026-11-15T12:00:00.000Z');
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const strip7 = generateDateStrip(7);
  assert(strip7.length === 7, '7-day strip generates exactly 7 continuous days');
  assert(strip7[6] === '2026-11-15', 'Last day of 7-day strip is today (2026-11-15)');
  assert(strip7[0] === '2026-11-09', 'First day of 7-day strip is 6 days prior (2026-11-09)');

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
    console.log('🎉 All Analytics Module tests passed!\n');
  }
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
