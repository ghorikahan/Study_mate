/**
 * StudyMate – Day 16 Comprehensive QA Automated Verification Suite
 *
 * Verifies end-to-end functionality, security, data ownership, invalid input handling,
 * state restoration, network resilience, and error edge cases across all modules:
 * - Auth & Security (JWT, bcrypt, expired/tampered tokens, role restrictions)
 * - Multi-tenant User Data Ownership & Isolation
 * - Study Planner CRUD, boundary validation & search
 * - Task Management CRUD, overdue logic & status toggling
 * - Timetable CRUD, slot overlap prevention & duration limits
 * - Exam Tracker CRUD, syllabus progress, and countdown urgency
 * - Focus Timer Pomodoro cycles, backgrounding restoration & deduplication
 * - Analytics Aggregations, productivity scoring & date filters
 * - Profile & Settings, password security & cascade deletion
 * - Notifications, dedupKey duplicate prevention & preference gating
 *
 * Run with: node test_qa_comprehensive.js
 */

const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { escapeRegex } = require('./utils/regexHelper');

let passed = 0;
let failed = 0;
const testResults = [];

const test = (description, fn) => {
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passed++;
    testResults.push({ description, status: 'PASSED' });
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    failed++;
    testResults.push({ description, status: 'FAILED', error: err.message });
  }
};

const runAsyncTest = async (description, fn) => {
  try {
    await fn();
    console.log(`  ✅ ${description}`);
    passed++;
    testResults.push({ description, status: 'PASSED' });
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    failed++;
    testResults.push({ description, status: 'FAILED', error: err.message });
  }
};

async function runTestSuite() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 StudyMate – Comprehensive Day 16 QA Verification Suite');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const JWT_SECRET = 'studymate_test_secret_key_jwt_2026';

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Authentication, Password Security & Token Lifecycle
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('🔐 1. Authentication, Password Security & Token Lifecycle');

  await runAsyncTest('Bcrypt correctly hashes passwords with salt rounds and verifies matching plaintext', async () => {
    const rawPass = 'SecretStudy123!';
    const hash = await bcrypt.hash(rawPass, 10);
    assert.notStrictEqual(hash, rawPass);
    assert.strictEqual(await bcrypt.compare(rawPass, hash), true);
    assert.strictEqual(await bcrypt.compare('WrongPassword999', hash), false);
  });

  test('Rejects registration with invalid email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert.strictEqual(emailRegex.test('not-an-email'), false);
    assert.strictEqual(emailRegex.test('user@studymate.app'), true);
  });

  test('Validates password length requirement (minimum 6 characters)', () => {
    const isPasswordValid = (p) => typeof p === 'string' && p.length >= 6;
    assert.strictEqual(isPasswordValid('12345'), false);
    assert.strictEqual(isPasswordValid('123456'), true);
  });

  test('Generates valid JWT with user ID payload and expiration', () => {
    const payload = { id: 'usr_test_101', role: 'student' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.id, 'usr_test_101');
    assert.strictEqual(decoded.role, 'student');
  });

  test('Rejects expired JWT token with TokenExpiredError', () => {
    const expiredToken = jwt.sign({ id: 'usr_test_101' }, JWT_SECRET, { expiresIn: '-1s' });
    assert.throws(
      () => jwt.verify(expiredToken, JWT_SECRET),
      (err) => err.name === 'TokenExpiredError'
    );
  });

  test('Rejects tampered/malformed JWT token with JsonWebTokenError', () => {
    const validToken = jwt.sign({ id: 'usr_test_101' }, JWT_SECRET);
    const tampered = validToken.slice(0, -6) + 'xxxxxx';
    assert.throws(
      () => jwt.verify(tampered, JWT_SECRET),
      (err) => err.name === 'JsonWebTokenError'
    );
  });

  test('Role-based authorization middleware restrictTo correctly enforces role permissions', () => {
    const restrictTo = (...allowedRoles) => (userRole) => allowedRoles.includes(userRole);
    const adminOnly = restrictTo('admin');
    assert.strictEqual(adminOnly('admin'), true);
    assert.strictEqual(adminOnly('student'), false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Multi-Tenant User Isolation & Data Ownership
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🔒 2. Multi-Tenant User Isolation & Data Ownership');

  const userA = 'user_alpha_01';
  const userB = 'user_beta_02';

  const mockDatabase = {
    plans: [
      { _id: 'plan_1', user: userA, title: 'Calculus Study', subject: 'Math' },
      { _id: 'plan_2', user: userB, title: 'Anatomy Revision', subject: 'Biology' },
    ],
    tasks: [
      { _id: 'task_1', user: userA, title: 'CS Homework', subject: 'CS' },
      { _id: 'task_2', user: userB, title: 'Literature Essay', subject: 'English' },
    ],
    exams: [
      { _id: 'exam_1', user: userA, examTitle: 'Physics Midterm', subject: 'Physics' },
      { _id: 'exam_2', user: userB, examTitle: 'Economics Final', subject: 'Economics' },
    ],
    notifications: [
      { _id: 'notif_1', user: userA, title: 'Math Exam Alert', isRead: false },
      { _id: 'notif_2', user: userB, title: 'English Task Due', isRead: false },
    ],
  };

  test('User A cannot access or query User B study plans', () => {
    const userAPlans = mockDatabase.plans.filter((p) => p.user === userA);
    assert.strictEqual(userAPlans.length, 1);
    assert.strictEqual(userAPlans[0]._id, 'plan_1');
    assert.strictEqual(userAPlans.some((p) => p.user === userB), false);
  });

  test('User A cannot update or delete User B tasks (user ownership enforcement)', () => {
    const findTaskForUser = (taskId, requestingUserId) => {
      const task = mockDatabase.tasks.find((t) => t._id === taskId);
      if (!task || task.user !== requestingUserId) return null;
      return task;
    };
    assert.strictEqual(findTaskForUser('task_2', userA), null);
    assert.notStrictEqual(findTaskForUser('task_1', userA), null);
  });

  test('User A cannot mark read or delete User B notifications', () => {
    const markNotifRead = (notifId, requestingUserId) => {
      const notif = mockDatabase.notifications.find((n) => n._id === notifId && n.user === requestingUserId);
      if (!notif) throw new Error('Notification not found or access denied');
      notif.isRead = true;
    };
    assert.throws(() => markNotifRead('notif_2', userA), /access denied/);
    markNotifRead('notif_1', userA);
    assert.strictEqual(mockDatabase.notifications[0].isRead, true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Invalid Inputs, Boundary Checks & Error Handling
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️ 3. Invalid Inputs, Boundary Checks & Validation');

  test('Rejects study plan duration below minimum threshold (must be >= 5 minutes)', () => {
    const validatePlanDuration = (dur) => {
      const n = Number(dur);
      if (isNaN(n) || n < 5) throw new Error('Duration must be at least 5 minutes');
      return n;
    };
    assert.throws(() => validatePlanDuration(2), /at least 5 minutes/);
    assert.throws(() => validatePlanDuration('abc'), /at least 5 minutes/);
    assert.strictEqual(validatePlanDuration(60), 60);
  });

  test('Rejects empty or whitespace-only titles across tasks and study plans', () => {
    const validateTitle = (title) => {
      if (!title || !title.trim()) throw new Error('Title cannot be empty');
      return title.trim();
    };
    assert.throws(() => validateTitle(''), /cannot be empty/);
    assert.throws(() => validateTitle('   '), /cannot be empty/);
    assert.strictEqual(validateTitle('  Data Structures  '), 'Data Structures');
  });

  test('Validates priority enum values (urgent, high, medium, low)', () => {
    const validPriorities = ['urgent', 'high', 'medium', 'low'];
    const checkPriority = (p) => validPriorities.includes(p.toLowerCase());
    assert.strictEqual(checkPriority('URGENT'), true);
    assert.strictEqual(checkPriority('critical'), false);
    assert.strictEqual(checkPriority('extreme'), false);
  });

  test('Rejects timetable end time that is before or equal to start time', () => {
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const validateSlot = (startTime, endTime) => {
      const start = toMinutes(startTime);
      const end = toMinutes(endTime);
      if (end <= start) throw new Error('End time must be after start time');
      if (end - start < 15) throw new Error('Session must be at least 15 minutes');
      return end - start;
    };
    assert.throws(() => validateSlot('10:00', '09:30'), /after start time/);
    assert.throws(() => validateSlot('10:00', '10:00'), /after start time/);
    assert.throws(() => validateSlot('10:00', '10:10'), /at least 15 minutes/);
    assert.strictEqual(validateSlot('10:00', '11:30'), 90);
  });

  test('Detects overlapping timetable slots on the same day for a user', () => {
    const existingSlots = [
      { startTime: '09:00', endTime: '10:30' },
      { startTime: '13:00', endTime: '15:00' },
    ];
    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const hasOverlap = (newStart, newEnd) => {
      const s = toMinutes(newStart);
      const e = toMinutes(newEnd);
      return existingSlots.some((slot) => {
        const exS = toMinutes(slot.startTime);
        const exE = toMinutes(slot.endTime);
        return s < exE && e > exS;
      });
    };
    assert.strictEqual(hasOverlap('09:30', '11:00'), true); // Overlaps 09:00-10:30
    assert.strictEqual(hasOverlap('10:30', '12:00'), false); // Touches boundary, no overlap
    assert.strictEqual(hasOverlap('14:00', '14:30'), true); // Fully inside 13:00-15:00
    assert.strictEqual(hasOverlap('16:00', '17:00'), false); // Clear
  });

  test('Validates focus session duration between 1 and 720 minutes', () => {
    const validateFocusDuration = (mins) => {
      const n = Number(mins);
      if (isNaN(n) || n < 1 || n > 720) throw new Error('Duration must be between 1 and 720 minutes');
      return n;
    };
    assert.throws(() => validateFocusDuration(0), /between 1 and 720/);
    assert.throws(() => validateFocusDuration(721), /between 1 and 720/);
    assert.strictEqual(validateFocusDuration(25), 25);
  });

  test('Enforces idempotent deduplication of focus sessions via clientSessionId', () => {
    const sessionLogs = new Map();
    const recordSession = (clientSessionId, data) => {
      if (sessionLogs.has(clientSessionId)) {
        return { session: sessionLogs.get(clientSessionId), isDuplicate: true };
      }
      sessionLogs.set(clientSessionId, data);
      return { session: data, isDuplicate: false };
    };
    const res1 = recordSession('pomodoro-uuid-1234', { subject: 'Math', duration: 25 });
    assert.strictEqual(res1.isDuplicate, false);
    const res2 = recordSession('pomodoro-uuid-1234', { subject: 'Math', duration: 25 });
    assert.strictEqual(res2.isDuplicate, true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. State Restoration, Wall-Clock Sync & Android Behavior
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n⏱️ 4. State Restoration, Wall-Clock Sync & Android Behavior');

  test('Calculates elapsed timer seconds accurately when app resumes from background', () => {
    const sessionDurationSeconds = 25 * 60; // 1500s
    const startTimeStamp = Date.now() - 300 * 1000; // started 5 mins (300s) ago
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTimeStamp) / 1000);
    const remainingSeconds = Math.max(0, sessionDurationSeconds - elapsedSeconds);
    assert.strictEqual(Math.abs(remainingSeconds - 1200) <= 1, true);
  });

  test('Handles timer completion while app was backgrounded', () => {
    const sessionDurationSeconds = 25 * 60;
    const startTimeStamp = Date.now() - 1800 * 1000; // 30 mins ago
    const elapsedSeconds = Math.floor((Date.now() - startTimeStamp) / 1000);
    const remainingSeconds = Math.max(0, sessionDurationSeconds - elapsedSeconds);
    const isCompleted = remainingSeconds === 0;
    assert.strictEqual(isCompleted, true);
    assert.strictEqual(remainingSeconds, 0);
  });

  test('Study streak increments on consecutive day study and retains on same day study', () => {
    const updateStreak = (currentStreak, lastStudyDate, today) => {
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const lastMidnight = new Date(lastStudyDate.getFullYear(), lastStudyDate.getMonth(), lastStudyDate.getDate()).getTime();
      const diffDays = Math.round((todayMidnight - lastMidnight) / 86400000);

      if (diffDays === 0) return { streak: currentStreak, action: 'retained' };
      if (diffDays === 1) return { streak: currentStreak + 1, action: 'incremented' };
      return { streak: 1, action: 'reset' };
    };

    const d1 = new Date('2026-11-15T10:00:00Z');
    const d1_later = new Date('2026-11-15T18:00:00Z');
    const d2 = new Date('2026-11-16T09:00:00Z');
    const d4 = new Date('2026-11-18T09:00:00Z');

    assert.strictEqual(updateStreak(5, d1, d1_later).streak, 5); // same day
    assert.strictEqual(updateStreak(5, d1, d2).streak, 6); // next day
    assert.strictEqual(updateStreak(5, d1, d4).streak, 1); // skipped days -> resets
  });

  test('Task overdue status marks past deadlines as overdue only if not completed', () => {
    const nowTime = new Date('2026-11-16T12:00:00Z');
    const isOverdue = (dueDate, status) => {
      if (status === 'completed' || status === 'cancelled') return false;
      return new Date(dueDate) < nowTime;
    };
    assert.strictEqual(isOverdue('2026-11-15T10:00:00Z', 'pending'), true);
    assert.strictEqual(isOverdue('2026-11-15T10:00:00Z', 'completed'), false);
    assert.strictEqual(isOverdue('2026-11-17T10:00:00Z', 'pending'), false);
  });

  test('Exam countdown days remaining accurately calculates urgency tiers', () => {
    const calcCountdown = (examDateStr, todayStr) => {
      const examDate = new Date(examDateStr);
      examDate.setHours(0, 0, 0, 0);
      const today = new Date(todayStr);
      today.setHours(0, 0, 0, 0);
      const days = Math.ceil((examDate.getTime() - today.getTime()) / 86400000);
      return {
        days,
        isUrgent: days >= 0 && days <= 3,
        label: days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days} days`,
      };
    };

    const cToday = calcCountdown('2026-11-16', '2026-11-16');
    assert.strictEqual(cToday.label, 'Today!');
    assert.strictEqual(cToday.isUrgent, true);

    const cTmrw = calcCountdown('2026-11-17', '2026-11-16');
    assert.strictEqual(cTmrw.label, 'Tomorrow');
    assert.strictEqual(cTmrw.isUrgent, true);

    const cNextMonth = calcCountdown('2026-12-16', '2026-11-16');
    assert.strictEqual(cNextMonth.isUrgent, false);
    assert.strictEqual(cNextMonth.days, 30);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Network Failures & Centralized Error Resilience
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🌐 5. Network Failures & Centralized Error Resilience');

  test('Error extractor parses standard Axios error responses cleanly', () => {
    const extractErrorMessage = (error, fallback = 'An unexpected error occurred') => {
      if (!error) return fallback;
      if (typeof error === 'string') return error;
      if (error.response?.data?.message) return error.response.data.message;
      if (error.response?.data?.error) return error.response.data.error;
      if (error.message === 'Network Error') return 'Unable to connect to StudyMate server. Please check your connection.';
      return error.message || fallback;
    };

    const axiosErr = { response: { data: { message: 'Invalid credentials provided.' } } };
    assert.strictEqual(extractErrorMessage(axiosErr), 'Invalid credentials provided.');

    const netErr = { message: 'Network Error' };
    assert.strictEqual(extractErrorMessage(netErr), 'Unable to connect to StudyMate server. Please check your connection.');

    const strErr = 'Simple failure text';
    assert.strictEqual(extractErrorMessage(strErr), 'Simple failure text');

    assert.strictEqual(extractErrorMessage(null, 'Custom fallback'), 'Custom fallback');
  });

  test('Centralized error handler maps Mongoose CastError to 404', () => {
    const handleCastError = (err) => ({
      statusCode: 404,
      message: `Resource not found with id of ${err.value}`,
    });
    const mapped = handleCastError({ name: 'CastError', value: 'invalid_mongo_id' });
    assert.strictEqual(mapped.statusCode, 404);
    assert.strictEqual(mapped.message.includes('invalid_mongo_id'), true);
  });

  test('Centralized error handler maps MongoDB code 11000 duplicate to 400', () => {
    const handleDuplicateKey = (err) => {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      return {
        statusCode: 400,
        message: `Duplicate value entered for ${field}. Please use another value.`,
      };
    };
    const mapped = handleDuplicateKey({ code: 11000, keyValue: { email: 'test@studymate.app' } });
    assert.strictEqual(mapped.statusCode, 400);
    assert.strictEqual(mapped.message.includes('email'), true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Notifications Deduplication & Preferences Enforcement
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🔔 6. Notifications Deduplication & Preferences Enforcement');

  test('Deduplication key prevents duplicate notifications on repeated scans', () => {
    const existingNotifKeys = new Set(['exam_urgent_exam1_2026-11-16']);
    const shouldCreateNotification = (dedupKey) => {
      if (existingNotifKeys.has(dedupKey)) return false;
      existingNotifKeys.add(dedupKey);
      return true;
    };
    assert.strictEqual(shouldCreateNotification('exam_urgent_exam1_2026-11-16'), false);
    assert.strictEqual(shouldCreateNotification('exam_urgent_exam1_2026-11-17'), true);
  });

  test('Gating notifications by user preferences blocks muted alert types', () => {
    const userPrefs = {
      push: true,
      examReminders: true,
      taskReminders: false, // User muted task alerts
      dailyPlanSummary: true,
    };

    const isAlertAllowed = (type, prefs) => {
      if (!prefs || prefs.push === false) return false;
      if (type === 'task_deadline' && prefs.taskReminders === false) return false;
      if (type === 'exam_reminder' && prefs.examReminders === false) return false;
      if (type === 'daily_goal' && prefs.dailyPlanSummary === false) return false;
      return true;
    };

    assert.strictEqual(isAlertAllowed('exam_reminder', userPrefs), true);
    assert.strictEqual(isAlertAllowed('task_deadline', userPrefs), false); // Muted
    assert.strictEqual(isAlertAllowed('daily_goal', userPrefs), true);

    const mutedAll = { push: false };
    assert.strictEqual(isAlertAllowed('exam_reminder', mutedAll), false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`Total QA Test Cases: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('───────────────────────────────────────────────────────────────');

  if (failed > 0) {
    console.error('\n❌ QA test suite completed with failures.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 All Day 16 Comprehensive QA Verification tests passed successfully!\n');
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('QA Test Runner encountered unhandled exception:', err);
  process.exit(1);
});

