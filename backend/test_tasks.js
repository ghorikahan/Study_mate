/**
 * StudyMate — Day 8 Task Management CRUD & Security Test Suite
 * Tests every operation: Create, Read, Update, Delete, Toggle Completion, Overdue Detection, and Ownership Protection.
 *
 * Run with: node test_tasks.js
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
  console.log('\n📋 StudyMate — Day 8 Task Management Tests\n');

  const { server, port } = await startServer();

  const { getDBStatus } = require('./config/db');
  const dbStatus = await getDBStatus();
  const dbConnected = dbStatus.isConnected;

  console.log('🛡️  Route Protection & Validation (Unit)');

  await test('POST /api/tasks — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'POST', path: '/api/tasks', body: { title: 'Test' } });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
    assert.strictEqual(r.body.success, false);
  });

  await test('GET /api/tasks — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'GET', path: '/api/tasks' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  await test('GET /api/tasks/:id — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'GET', path: '/api/tasks/507f1f77bcf86cd799439011' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  await test('PUT /api/tasks/:id — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'PUT', path: '/api/tasks/507f1f77bcf86cd799439011', body: {} });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  await test('DELETE /api/tasks/:id — requires auth (no token → 401)', async () => {
    const r = await request(port, { method: 'DELETE', path: '/api/tasks/507f1f77bcf86cd799439011' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  if (!dbConnected) {
    console.log('\n⏭️  Skipping database integration tests (MongoDB not configured).');
  } else {
    console.log('\n🗄️  CRUD Operations, Overdue Detection & Ownership (Integration)');

    const timestamp = Date.now();

    // 1. Register User 1
    const user1Res = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Task Scholar One',
        email: `task1_${timestamp}@studymate.dev`,
        password: 'Password123',
      },
    });
    assert.strictEqual(user1Res.status, 201, 'User 1 registered');
    const token1 = user1Res.body.data.token;

    // 2. Register User 2
    const user2Res = await request(port, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Task Scholar Two',
        email: `task2_${timestamp}@studymate.dev`,
        password: 'Password123',
      },
    });
    assert.strictEqual(user2Res.status, 201, 'User 2 registered');
    const token2 = user2Res.body.data.token;

    // ─── VALIDATION ──────────────────────────────────────────────────────────
    console.log('\n  Input Validation');

    await test('POST /api/tasks — rejects missing title (400)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/tasks',
        token: token1,
        body: { subject: 'Math', dueDate: new Date().toISOString() },
      });
      assert.strictEqual(r.status, 400);
      assert.ok(r.body.message.includes('title is required'));
    });

    await test('POST /api/tasks — rejects missing subject (400)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/tasks',
        token: token1,
        body: { title: 'Solve Exercises', dueDate: new Date().toISOString() },
      });
      assert.strictEqual(r.status, 400);
      assert.ok(r.body.message.includes('Subject is required'));
    });

    await test('POST /api/tasks — rejects missing dueDate (400)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/tasks',
        token: token1,
        body: { title: 'Solve Exercises', subject: 'Math' },
      });
      assert.strictEqual(r.status, 400);
      assert.ok(r.body.message.includes('Due date is required'));
    });

    // ─── CREATE & OVERDUE DETECTION ──────────────────────────────────────────
    console.log('\n  Create & Overdue Detection');

    let futureTaskId = null;
    let overdueTaskId = null;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    await test('POST /api/tasks — creates a future task with priority and duration', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/tasks',
        token: token1,
        body: {
          title: 'Implement Dijkstra Algorithm',
          subject: 'Algorithms',
          dueDate: futureDate.toISOString(),
          priority: 'high',
          estimatedMinutes: 60,
          description: 'Graph traversal shortest path implementation in TypeScript',
        },
      });

      assert.strictEqual(r.status, 201);
      assert.strictEqual(r.body.success, true);
      assert.ok(r.body.data.task);

      const t = r.body.data.task;
      assert.strictEqual(t.title, 'Implement Dijkstra Algorithm');
      assert.strictEqual(t.subject, 'Algorithms');
      assert.strictEqual(t.priority, 'high');
      assert.strictEqual(t.status, 'pending');
      assert.strictEqual(t.isOverdue, false, 'Future task must not be overdue');

      futureTaskId = t._id;
    });

    await test('POST /api/tasks — creates an overdue task (dueDate in past)', async () => {
      const r = await request(port, {
        method: 'POST',
        path: '/api/tasks',
        token: token1,
        body: {
          title: 'Submit Lab 1 Report',
          subject: 'Operating Systems',
          dueDate: pastDate.toISOString(),
          priority: 'urgent',
          estimatedMinutes: 45,
        },
      });

      assert.strictEqual(r.status, 201);
      assert.strictEqual(r.body.data.task.isOverdue, true, 'Past task must be flagged as isOverdue');

      overdueTaskId = r.body.data.task._id;
    });

    // ─── READ & FILTERING ────────────────────────────────────────────────────
    console.log('\n  Read & Filtering');

    await test('GET /api/tasks — returns task list and accurate counts (total, pending, overdue)', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/tasks',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.ok(r.body.data.tasks.length >= 2);

      const counts = r.body.data.counts;
      assert.ok(counts.total >= 2);
      assert.ok(counts.pending >= 2);
      assert.ok(counts.overdue >= 1, 'Should detect at least 1 overdue task');
      assert.ok(r.body.data.subjects.includes('Algorithms'));
      assert.ok(r.body.data.subjects.includes('Operating Systems'));
    });

    await test('GET /api/tasks?status=overdue — filters only overdue tasks', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/tasks?status=overdue',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.ok(r.body.data.tasks.length >= 1);
      assert.ok(r.body.data.tasks.every((t) => t.isOverdue === true));
    });

    await test('GET /api/tasks?priority=high — filters high priority tasks', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/tasks?priority=high',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.ok(r.body.data.tasks.every((t) => t.priority === 'high'));
    });

    await test('GET /api/tasks?subject=Algorithms — filters by subject', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/tasks?subject=Algorithms',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.ok(r.body.data.tasks.every((t) => t.subject === 'Algorithms'));
    });

    await test('GET /api/tasks?search=Dijkstra — searches title/topic', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/tasks?search=Dijkstra',
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.ok(r.body.data.tasks.length >= 1);
      assert.ok(r.body.data.tasks[0].title.includes('Dijkstra'));
    });

    // ─── OWNERSHIP ENFORCEMENT ───────────────────────────────────────────────
    console.log('\n  Ownership Security');

    await test('GET /api/tasks/:id — User 2 CANNOT read User 1 task (returns 404)', async () => {
      const r = await request(port, {
        method: 'GET',
        path: `/api/tasks/${futureTaskId}`,
        token: token2, // User 2!
      });

      assert.strictEqual(r.status, 404);
      assert.strictEqual(r.body.success, false);
    });

    await test('GET /api/tasks — User 2 sees 0 tasks (isolated data)', async () => {
      const r = await request(port, {
        method: 'GET',
        path: '/api/tasks',
        token: token2,
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.data.counts.total, 0);
    });

    // ─── UPDATE & TOGGLE COMPLETION ──────────────────────────────────────────
    console.log('\n  Update & Completion Toggle');

    await test('PUT /api/tasks/:id — User 2 CANNOT update User 1 task (returns 404)', async () => {
      const r = await request(port, {
        method: 'PUT',
        path: `/api/tasks/${futureTaskId}`,
        token: token2,
        body: { title: 'Hacked Title' },
      });

      assert.strictEqual(r.status, 404);
    });

    await test('PUT /api/tasks/:id — User 1 updates task details', async () => {
      const r = await request(port, {
        method: 'PUT',
        path: `/api/tasks/${futureTaskId}`,
        token: token1,
        body: {
          title: 'Implement Dijkstra & Bellman-Ford Algorithms',
          estimatedMinutes: 90,
          priority: 'urgent',
        },
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.data.task.title, 'Implement Dijkstra & Bellman-Ford Algorithms');
      assert.strictEqual(r.body.data.task.estimatedMinutes, 90);
      assert.strictEqual(r.body.data.task.priority, 'urgent');
    });

    await test('PATCH /api/tasks/:id/toggle — toggles task to completed and records completedAt', async () => {
      const r = await request(port, {
        method: 'PATCH',
        path: `/api/tasks/${futureTaskId}/toggle`,
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      const t = r.body.data.task;
      assert.strictEqual(t.status, 'completed');
      assert.strictEqual(t.isCompleted, true);
      assert.ok(t.completedAt, 'completedAt should be timestamped');
      assert.strictEqual(t.isOverdue, false, 'Completed tasks are never overdue');
    });

    await test('PATCH /api/tasks/:id/toggle — toggles completed task back to pending', async () => {
      const r = await request(port, {
        method: 'PATCH',
        path: `/api/tasks/${futureTaskId}/toggle`,
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      const t = r.body.data.task;
      assert.strictEqual(t.status, 'pending');
      assert.strictEqual(t.isCompleted, false);
      assert.strictEqual(t.completedAt, null);
    });

    // ─── DELETE ──────────────────────────────────────────────────────────────
    console.log('\n  Delete');

    await test('DELETE /api/tasks/:id — User 2 CANNOT delete User 1 task (returns 404)', async () => {
      const r = await request(port, {
        method: 'DELETE',
        path: `/api/tasks/${futureTaskId}`,
        token: token2,
      });

      assert.strictEqual(r.status, 404);
    });

    await test('DELETE /api/tasks/:id — User 1 deletes their task', async () => {
      const r = await request(port, {
        method: 'DELETE',
        path: `/api/tasks/${futureTaskId}`,
        token: token1,
      });

      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.body.success, true);
    });

    await test('DELETE /api/tasks/:id — User 1 deletes overdue task', async () => {
      const r = await request(port, {
        method: 'DELETE',
        path: `/api/tasks/${overdueTaskId}`,
        token: token1,
      });

      assert.strictEqual(r.status, 200);
    });
  }

  server.close();

  console.log('\n' + '─'.repeat(55));
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All Task Management tests passed!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥 Test runner crashed:', err.message);
  process.exit(1);
});

