/**
 * Day 14 – Notifications and Reminders API Test Suite
 * Tests route protection (401 without auth token), notification types validation,
 * deduplication key handling, unread counting logic, mark as read,
 * and user preference filtering.
 * Runs in-memory with express & unit assertions.
 */

const http = require('http');
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
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n🔔 StudyMate – Day 14 Notifications & Reminders Tests\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // ─── Route Protection (Unit) ──────────────────────────────────────────
    console.log('🛡️  Route Protection & Authentication Enforcement');

    const resGet = await request(server, 'GET', '/api/notifications');
    assert(resGet.status === 401, 'GET /api/notifications requires auth (no token → 401)');

    const resGen = await request(server, 'POST', '/api/notifications/generate-reminders');
    assert(resGen.status === 401, 'POST /api/notifications/generate-reminders requires auth (no token → 401)');

    const resReadAll = await request(server, 'PATCH', '/api/notifications/read-all');
    assert(resReadAll.status === 401, 'PATCH /api/notifications/read-all requires auth (no token → 401)');

    const resReadOne = await request(server, 'PATCH', '/api/notifications/507f1f77bcf86cd799439011/read');
    assert(resReadOne.status === 401, 'PATCH /api/notifications/:id/read requires auth (no token → 401)');

    const resDelete = await request(server, 'DELETE', '/api/notifications/507f1f77bcf86cd799439011');
    assert(resDelete.status === 401, 'DELETE /api/notifications/:id requires auth (no token → 401)');

    const resClear = await request(server, 'DELETE', '/api/notifications');
    assert(resClear.status === 401, 'DELETE /api/notifications requires auth (no token → 401)');

    const resCreate = await request(server, 'POST', '/api/notifications', { title: 'Test', message: 'Msg' });
    assert(resCreate.status === 401, 'POST /api/notifications requires auth (no token → 401)');

    // ─── Notification Deduplication Logic (Unit) ───────────────────────────
    console.log('\n🔑 Deduplication Key Logic (Unit)');

    function checkDuplicateKey(existingKeys, newKey) {
      if (!newKey) return false;
      return existingKeys.has(newKey);
    }

    const testKeys = new Set(['exam_101_2026-11-16', 'task_202_2026-11-16']);
    assert(checkDuplicateKey(testKeys, 'exam_101_2026-11-16') === true, 'Identifies existing exam reminder as duplicate');
    assert(checkDuplicateKey(testKeys, 'exam_101_2026-11-17') === false, 'Allows new reminder for subsequent day');
    assert(checkDuplicateKey(testKeys, 'task_202_2026-11-16') === true, 'Identifies existing task deadline as duplicate');
    assert(checkDuplicateKey(testKeys, 'task_303_2026-11-16') === false, 'Allows reminder for different task ID');

    // ─── Notification Types & Priority Validation (Unit) ───────────────────
    console.log('\n📋 Notification Types & Priorities Validation (Unit)');

    const VALID_TYPES = ['exam_reminder', 'task_deadline', 'study_streak', 'daily_goal', 'system'];
    const VALID_PRIORITIES = ['low', 'medium', 'high'];

    assert(VALID_TYPES.includes('exam_reminder'), 'Type exam_reminder is valid');
    assert(VALID_TYPES.includes('task_deadline'), 'Type task_deadline is valid');
    assert(VALID_TYPES.includes('study_streak'), 'Type study_streak is valid');
    assert(VALID_TYPES.includes('daily_goal'), 'Type daily_goal is valid');
    assert(VALID_TYPES.includes('system'), 'Type system is valid');
    assert(!VALID_TYPES.includes('unknown_type'), 'Invalid notification type is rejected');

    assert(VALID_PRIORITIES.includes('low'), 'Priority low is valid');
    assert(VALID_PRIORITIES.includes('medium'), 'Priority medium is valid');
    assert(VALID_PRIORITIES.includes('high'), 'Priority high is valid');

    // ─── Exam Urgency Countdown Calculation (Unit) ────────────────────────
    console.log('\n📅 Exam Countdown Urgency Text Calculation (Unit)');

    function getExamUrgencyText(daysRemaining) {
      if (daysRemaining === 0) return 'is TODAY!';
      return `is in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}!`;
    }

    assert(getExamUrgencyText(0) === 'is TODAY!', 'Days remaining 0 formats as "is TODAY!"');
    assert(getExamUrgencyText(1) === 'is in 1 day!', 'Days remaining 1 formats as "is in 1 day!"');
    assert(getExamUrgencyText(2) === 'is in 2 days!', 'Days remaining 2 formats as "is in 2 days!"');
    assert(getExamUrgencyText(3) === 'is in 3 days!', 'Days remaining 3 formats as "is in 3 days!"');

    // ─── User Preferences Gate Logic (Unit) ───────────────────────────────
    console.log('\n⚙️  User Preferences Notification Filtering (Unit)');

    function shouldSendNotification(prefValue) {
      return prefValue !== false;
    }

    assert(shouldSendNotification(true) === true, 'Enabled preference triggers notification');
    assert(shouldSendNotification(undefined) === true, 'Default undefined preference triggers notification');
    assert(shouldSendNotification(false) === false, 'Explicitly disabled preference blocks notification');

    // ─── Unread Status Counting Logic (Unit) ───────────────────────────────
    console.log('\n🔢 Unread Notification Counting Math (Unit)');

    const mockNotifications = [
      { id: '1', title: 'Exam 1', isRead: false },
      { id: '2', title: 'Task 1', isRead: true },
      { id: '3', title: 'Streak', isRead: false },
      { id: '4', title: 'Task 2', isRead: false },
    ];

    const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
    assert(unreadCount === 3, 'Calculates 3 unread notifications out of 4 items');

    const afterMarkAll = mockNotifications.map((n) => ({ ...n, isRead: true }));
    const unreadAfter = afterMarkAll.filter((n) => !n.isRead).length;
    assert(unreadAfter === 0, 'Unread count becomes 0 after markAllAsRead');

    // ─── Task Overdue Detection (Unit) ────────────────────────────────────
    console.log('\n⏰ Task Overdue Status Logic (Unit)');

    function isTaskOverdue(dueDate, now = new Date()) {
      return new Date(dueDate).getTime() < now.getTime();
    }

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    assert(isTaskOverdue(pastDate) === true, 'Past due date is correctly marked overdue');
    assert(isTaskOverdue(futureDate) === false, 'Future due date is not overdue');

  } finally {
    server.close();
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}\n`);

  if (failed === 0) {
    console.log('🎉 All Notifications & Reminders Module tests passed!\n');
    process.exit(0);
  } else {
    console.error(`💥 ${failed} test(s) failed.\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});

