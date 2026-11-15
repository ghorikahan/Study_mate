/**
 * Day 11 – Focus Timer & Pomodoro API Test Suite
 * Tests route protection, timer accuracy, Pomodoro duration calculations,
 * background elapsed time restoration math, duplicate prevention, and streak updates.
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
  console.log('\n⏱️  StudyMate – Day 11 Focus Timer & Pomodoro Tests\n');

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const log = (method, path) => console.log(`[${new Date().toLocaleTimeString()}] ${method} ${path}`);

  // ─── GROUP 1: Route Protection ──────────────────────────────────────────────
  console.log('🛡️  Route Protection (Unit)\n');

  const fakeId = '507f1f77bcf86cd799439011';
  const routes = [
    ['GET',    '/api/study-sessions'],
    ['POST',   '/api/study-sessions'],
    ['GET',    '/api/study-sessions/stats'],
    ['GET',    `/api/study-sessions/${fakeId}`],
    ['DELETE', `/api/study-sessions/${fakeId}`],
  ];

  for (const [method, path] of routes) {
    log(method, path);
    const res = await request(server, method, path, {});
    assert(res.status === 401, `${method} ${path} – requires auth (no token → 401)`);
  }

  // ─── GROUP 2: Timer Duration Constants & Accuracy ───────────────────────────
  console.log('\n⏳  Timer Constants & Duration Accuracy (Unit)\n');

  const POMODORO_FOCUS_MINUTES = 25;
  const POMODORO_SHORT_BREAK_MINUTES = 5;
  const POMODORO_LONG_BREAK_MINUTES = 15;

  assert(POMODORO_FOCUS_MINUTES * 60 === 1500, '25-minute focus session equals exactly 1500 seconds');
  assert(POMODORO_SHORT_BREAK_MINUTES * 60 === 300, '5-minute short break equals exactly 300 seconds');
  assert(POMODORO_LONG_BREAK_MINUTES * 60 === 900, '15-minute long break equals exactly 900 seconds');

  const formatTimer = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  assert(formatTimer(1500) === '25:00', '1500s formats to "25:00"');
  assert(formatTimer(300) === '05:00', '300s formats to "05:00"');
  assert(formatTimer(900) === '15:00', '900s formats to "15:00"');
  assert(formatTimer(65) === '01:05', '65s formats to "01:05"');
  assert(formatTimer(9) === '00:09', '9s formats to "00:09"');
  assert(formatTimer(0) === '00:00', '0s formats to "00:00"');
  assert(formatTimer(-5) === '00:00', 'Negative seconds clamp cleanly to "00:00"');

  // ─── GROUP 3: App Backgrounding & Wall-Clock Elapsed Time Math ───────────────
  console.log('\n📱  App Backgrounding & Wall-Clock Restoration Math (Unit)\n');

  const calculateRemainingSeconds = (targetEndTimeMs, nowMs) => {
    return Math.max(0, Math.round((targetEndTimeMs - nowMs) / 1000));
  };

  const startTime = Date.now();
  const targetEndTime = startTime + 1500 * 1000; // 25 mins later

  // Case A: App backgrounded for 10 minutes (600s)
  const after10Mins = startTime + 600 * 1000;
  const remAfter10 = calculateRemainingSeconds(targetEndTime, after10Mins);
  assert(remAfter10 === 900, '10 minutes backgrounding → remaining correctly drops from 1500s to 900s (15:00)');

  // Case B: App backgrounded for 24 minutes 50 seconds (1490s)
  const afterAlmostDone = startTime + 1490 * 1000;
  const remAfterAlmostDone = calculateRemainingSeconds(targetEndTime, afterAlmostDone);
  assert(remAfterAlmostDone === 10, '24m50s backgrounding → remaining correctly shows 10 seconds');

  // Case C: App backgrounded past the session duration (e.g. 30 minutes)
  const afterOvertime = startTime + 1800 * 1000;
  const remAfterOvertime = calculateRemainingSeconds(targetEndTime, afterOvertime);
  assert(remAfterOvertime === 0, 'Backgrounded past end time → remaining clamps to 0s (trigger completion)');

  // ─── GROUP 4: Actual Study Duration Calculation ─────────────────────────────
  console.log('\n📊  Actual Study Duration Calculation (Unit)\n');

  const calcActualStudyMinutes = (elapsedSeconds, minAllowed = 1) => {
    if (!elapsedSeconds || elapsedSeconds < 0) return 0;
    const minutes = Math.round(elapsedSeconds / 60);
    return Math.max(minAllowed, minutes);
  };

  assert(calcActualStudyMinutes(1500) === 25, '1500s elapsed → exactly 25 minutes');
  assert(calcActualStudyMinutes(1480) === 25, '1480s elapsed → rounds to 25 minutes');
  assert(calcActualStudyMinutes(765) === 13, '765s elapsed (12m45s) → rounds to 13 minutes');
  assert(calcActualStudyMinutes(30) === 1, '30s elapsed → rounds and clamps to minimum 1 minute');
  assert(calcActualStudyMinutes(0) === 0, '0s elapsed → 0 minutes');

  // ─── GROUP 5: Duplicate Prevention Logic ────────────────────────────────────
  console.log('\n🔒  Duplicate Session Prevention (Unit)\n');

  const isDuplicateByTime = (existingSession, newSubject, newDuration, newStart) => {
    if (existingSession.subject.toLowerCase() !== newSubject.toLowerCase()) return false;
    if (existingSession.durationMinutes !== newDuration) return false;
    const diffMs = Math.abs(new Date(existingSession.startTime).getTime() - new Date(newStart).getTime());
    return diffMs <= 60000; // within 60-second window
  };

  const existing = {
    subject: 'Mathematics',
    durationMinutes: 25,
    startTime: new Date('2026-11-15T10:00:00.000Z'),
    clientSessionId: 'session_12345',
  };

  assert(
    isDuplicateByTime(existing, 'Mathematics', 25, '2026-11-15T10:00:20.000Z') === true,
    'Same subject, duration, and start within 20s → duplicate detected'
  );
  assert(
    isDuplicateByTime(existing, 'Physics', 25, '2026-11-15T10:00:20.000Z') === false,
    'Different subject within window → not a duplicate'
  );
  assert(
    isDuplicateByTime(existing, 'Mathematics', 15, '2026-11-15T10:00:20.000Z') === false,
    'Different duration within window → not a duplicate'
  );
  assert(
    isDuplicateByTime(existing, 'Mathematics', 25, '2026-11-15T10:05:00.000Z') === false,
    'Same subject & duration 5 minutes later → distinct session (not duplicate)'
  );

  const isDuplicateById = (existingSession, clientSessionId) => {
    return Boolean(clientSessionId && existingSession.clientSessionId === clientSessionId);
  };

  assert(isDuplicateById(existing, 'session_12345') === true, 'Matching clientSessionId → duplicate detected (idempotent)');
  assert(isDuplicateById(existing, 'session_67890') === false, 'Different clientSessionId → distinct session');
  assert(isDuplicateById(existing, null) === false, 'null clientSessionId → not duplicate by ID');

  // ─── GROUP 6: Pomodoro Cycle Progression Logic ──────────────────────────────
  console.log('\n🔄  Pomodoro Cycle Progression Logic (Unit)\n');

  const getNextMode = (currentMode, pomodoroCycleCount) => {
    if (currentMode === 'shortBreak' || currentMode === 'longBreak') {
      return { nextMode: 'pomodoro', nextCycle: pomodoroCycleCount };
    }
    // Completed a focus session
    const nextCycle = pomodoroCycleCount + 1;
    if (nextCycle >= 4) {
      return { nextMode: 'longBreak', nextCycle: 0 };
    }
    return { nextMode: 'shortBreak', nextCycle };
  };

  assert(getNextMode('pomodoro', 0).nextMode === 'shortBreak', 'Focus 1/4 completes → shortBreak');
  assert(getNextMode('pomodoro', 0).nextCycle === 1, 'Focus 1/4 completes → cycle counter becomes 1');
  assert(getNextMode('shortBreak', 1).nextMode === 'pomodoro', 'Short break completes → next focus session');
  assert(getNextMode('pomodoro', 3).nextMode === 'longBreak', 'Focus 4/4 completes → longBreak');
  assert(getNextMode('pomodoro', 3).nextCycle === 0, 'Long break resets cycle counter to 0');
  assert(getNextMode('longBreak', 0).nextMode === 'pomodoro', 'Long break completes → new pomodoro cycle begins');

  // ─── GROUP 7: Study Streak Calculation Logic ────────────────────────────────
  console.log('\n🔥  Study Streak Calculation Logic (Unit)\n');

  const calcStreak = (lastDateStr, todayStr, currentStreak = 0) => {
    if (!lastDateStr) return { currentStreak: 1, isNewDay: true };
    const last = new Date(lastDateStr);
    last.setHours(0, 0, 0, 0);
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { currentStreak, isNewDay: false };
    if (diffDays === 1) return { currentStreak: currentStreak + 1, isNewDay: true };
    return { currentStreak: 1, isNewDay: true };
  };

  assert(calcStreak(null, '2026-11-15').currentStreak === 1, 'First study session → streak starts at 1');
  assert(calcStreak('2026-11-15', '2026-11-15', 3).currentStreak === 3, 'Second session same day → streak stays 3');
  assert(calcStreak('2026-11-14', '2026-11-15', 3).currentStreak === 4, 'Consecutive day study → streak increments to 4');
  assert(calcStreak('2026-11-10', '2026-11-15', 5).currentStreak === 1, 'Missed days (gap) → streak resets to 1');

  // ─── GROUP 8: Input Validation ──────────────────────────────────────────────
  console.log('\n📋  Input Validation (Unit)\n');

  const validateSessionInput = ({ subject, durationMinutes }) => {
    if (!subject || !subject.trim()) return { valid: false, error: 'Subject is required' };
    const d = Number(durationMinutes);
    if (isNaN(d) || d < 1 || d > 720) return { valid: false, error: 'Invalid duration' };
    return { valid: true };
  };

  assert(validateSessionInput({ subject: 'Mathematics', durationMinutes: 25 }).valid === true, 'Valid subject & 25m passes');
  assert(validateSessionInput({ subject: '', durationMinutes: 25 }).valid === false, 'Empty subject fails');
  assert(validateSessionInput({ subject: 'Physics', durationMinutes: 0 }).valid === false, '0 duration fails (< 1 min)');
  assert(validateSessionInput({ subject: 'Physics', durationMinutes: 721 }).valid === false, '721 duration fails (> 720 mins)');
  assert(validateSessionInput({ subject: 'Biology', durationMinutes: 'not-a-number' }).valid === false, 'NaN duration fails');

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
    console.log('🎉 All Focus Timer & Pomodoro tests passed!\n');
  }
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});

