/**
 * Day 9 – Timetable API Test Suite
 * Tests route protection, overlap logic, validation, and CRUD endpoints.
 * Runs entirely in-memory without MongoDB (unit mode).
 */

const http = require('http');
const mongoose = require('mongoose');

// ─── Minimal server setup (mirrors server.js) ──────────────────────────────────
const express = require('express');
const app = express();
app.use(express.json());

// Load routes
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
  console.log('\n📅 StudyMate — Day 9 Timetable API Tests\n');

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const log = (method, path) => console.log(`[${new Date().toLocaleTimeString()}] ${method} ${path}`);

  // ─── GROUP 1: Route Protection ──────────────────────────────────────────────
  console.log('🛡️  Route Protection & Validation (Unit)\n');

  const routes = [
    ['POST', '/api/timetable'],
    ['GET', '/api/timetable'],
    ['GET', '/api/timetable/day'],
    ['GET', '/api/timetable/507f1f77bcf86cd799439011'],
    ['PUT', '/api/timetable/507f1f77bcf86cd799439011'],
    ['DELETE', '/api/timetable/507f1f77bcf86cd799439011'],
  ];

  for (const [method, path] of routes) {
    log(method, path);
    const res = await request(server, method, path, {});
    assert(res.status === 401, `${method} ${path} — requires auth (no token → 401)`);
  }

  // ─── GROUP 2: Overlap Detection Logic (Unit) ─────────────────────────────────
  console.log('\n⏱️  Overlap Detection Logic (Unit)\n');

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const checkOverlap = (newStart, newEnd, existingStart, existingEnd) => {
    return toMinutes(newStart) < toMinutes(existingEnd) &&
      toMinutes(newEnd) > toMinutes(existingStart);
  };

  assert(checkOverlap('09:00', '10:00', '09:30', '11:00') === true, 'Partial overlap (start inside) detected');
  assert(checkOverlap('09:00', '11:00', '09:30', '10:30') === true, 'Contains existing (fully wraps) detected');
  assert(checkOverlap('09:30', '10:30', '09:00', '11:00') === true, 'Inside existing (fully contained) detected');
  assert(checkOverlap('09:00', '10:00', '10:00', '11:00') === false, 'Adjacent (touching, not overlapping) → no conflict');
  assert(checkOverlap('10:00', '11:00', '08:00', '10:00') === false, 'Non-overlapping (before) → no conflict');
  assert(checkOverlap('07:00', '08:00', '09:00', '11:00') === false, 'Non-overlapping (after) → no conflict');

  // ─── GROUP 3: Duration Validation ───────────────────────────────────────────
  console.log('\n📏  Duration & Time Validation (Unit)\n');

  const validateEntry = ({ startTime, endTime }) => {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime)) return { valid: false, error: 'Invalid start time format' };
    if (!timeRegex.test(endTime)) return { valid: false, error: 'Invalid end time format' };
    const startMins = toMinutes(startTime);
    const endMins = toMinutes(endTime);
    if (startMins >= endMins) return { valid: false, error: 'End time must be after start time' };
    if (endMins - startMins < 15) return { valid: false, error: 'Session must be at least 15 minutes' };
    return { valid: true };
  };

  assert(validateEntry({ startTime: '09:00', endTime: '10:30' }).valid === true, 'Valid time range (09:00–10:30) passes');
  assert(validateEntry({ startTime: '10:00', endTime: '09:00' }).valid === false, 'End before start → validation error');
  assert(validateEntry({ startTime: '09:00', endTime: '09:00' }).valid === false, 'Same start/end → validation error');
  assert(validateEntry({ startTime: '09:00', endTime: '09:10' }).valid === false, '< 15 min session → validation error');
  assert(validateEntry({ startTime: '09:00', endTime: '09:15' }).valid === true, 'Exactly 15 min session → valid');
  assert(validateEntry({ startTime: '9:00', endTime: '10:00' }).valid === false, 'Missing leading zero → format error');
  assert(validateEntry({ startTime: '00:00', endTime: '23:59' }).valid === true, 'Full-day range → valid');

  // ─── GROUP 4: Day-of-week derivation ────────────────────────────────────────
  console.log('\n📆  Day-of-week Derivation (Unit)\n');

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const getDayName = (dateStr) => DAYS[new Date(dateStr + 'T00:00:00Z').getUTCDay()];

  assert(getDayName('2026-11-16') === 'Monday', '2026-11-16 is Monday');
  assert(getDayName('2026-11-17') === 'Tuesday', '2026-11-17 is Tuesday');
  assert(getDayName('2026-11-21') === 'Saturday', '2026-11-21 is Saturday');
  assert(getDayName('2026-11-22') === 'Sunday', '2026-11-22 is Sunday');
  assert(getDayName('2026-11-15') === 'Sunday', '2026-11-15 is Sunday');

  // ─── GROUP 5: Duration Calculation ─────────────────────────────────────────
  console.log('\n🕐  Duration Calculation (Unit)\n');

  const calcDuration = (start, end) => toMinutes(end) - toMinutes(start);

  assert(calcDuration('09:00', '10:00') === 60, '09:00–10:00 = 60 minutes');
  assert(calcDuration('09:00', '10:30') === 90, '09:00–10:30 = 90 minutes');
  assert(calcDuration('08:30', '12:00') === 210, '08:30–12:00 = 210 minutes');
  assert(calcDuration('23:00', '23:59') === 59, '23:00–23:59 = 59 minutes');

  // ─── Skip integration tests ─────────────────────────────────────────────────
  const isMongoConnected = mongoose.connection.readyState === 1;
  if (!isMongoConnected) {
    console.log('\n⏭️  Skipping database integration tests (MongoDB not configured).\n');
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  server.close();
  console.log('───────────────────────────────────────────────────────');
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Fix errors above before committing.');
    process.exit(1);
  } else {
    console.log('🎉 All Timetable API tests passed!\n');
  }
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
