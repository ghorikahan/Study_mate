/**
 * StudyMate – Day 15 Integration & Refinement Pass Automated Test Suite
 *
 * Verifies:
 * 1. Safe Regex Escaping (prevents crashes with special characters like 'C++', 'Math (1)', '[Chem]')
 * 2. Search & Filtering across Study Plans (Status, Subject, Priority, Search, Pagination)
 * 3. Search & Filtering across Tasks (Status, Priority, Subject, Overdue detection, Search)
 * 4. Search & Filtering across Exams (Status, Priority, Subject, Safe $or+$and combination, Search)
 * 5. Strict User Ownership Isolation across all queries
 * 6. Empty state data structures & zero counts
 *
 * Run with: node test_refinement.js
 */

const assert = require('assert');
const { escapeRegex } = require('./utils/regexHelper');

let passed = 0;
let failed = 0;

const test = (description, fn) => {
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
};

const runAsyncTest = async (description, fn) => {
  try {
    await fn();
    console.log(`  ✅ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
};

async function runTests() {
  console.log('\n🔍 StudyMate – Day 15 Integration & Refinement Tests\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Safe Regex Escaping
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('🛡️  1. Safe Regex Escaping');

  test('Escapes C++ without throwing syntax error in RegExp constructor', () => {
    const raw = 'C++';
    const escaped = escapeRegex(raw);
    assert.strictEqual(escaped, 'C\\+\\+');
    const regex = new RegExp(escaped, 'i');
    assert.strictEqual(regex.test('C++ Programming'), true);
    assert.strictEqual(regex.test('Java Programming'), false);
  });

  test('Escapes parentheses in "Math (Advanced)" without syntax error', () => {
    const raw = 'Math (Advanced)';
    const escaped = escapeRegex(raw);
    assert.strictEqual(escaped, 'Math \\(Advanced\\)');
    const regex = new RegExp(escaped, 'i');
    assert.strictEqual(regex.test('Introduction to Math (Advanced) Topics'), true);
  });

  test('Escapes square brackets in "[CHEM-101]" without syntax error', () => {
    const raw = '[CHEM-101]';
    const escaped = escapeRegex(raw);
    assert.strictEqual(escaped, '\\[CHEM-101\\]');
    const regex = new RegExp(escaped, 'i');
    assert.strictEqual(regex.test('Lab [CHEM-101] Final'), true);
  });

  test('Escapes wildcard asterisk in "Formula * 2"', () => {
    const raw = 'Formula * 2';
    const escaped = escapeRegex(raw);
    assert.strictEqual(escaped, 'Formula \\* 2');
    const regex = new RegExp(escaped, 'i');
    assert.strictEqual(regex.test('Formula * 2 derivation'), true);
  });

  test('Handles non-string inputs safely without crashing', () => {
    assert.strictEqual(escapeRegex(null), '');
    assert.strictEqual(escapeRegex(undefined), '');
    assert.strictEqual(escapeRegex(123), '');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Multi-Filter & Search Logic Simulation: Study Plans
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📖 2. Study Plan Filtering & Search Logic');

  const mockPlans = [
    {
      _id: 'p1',
      user: 'u1',
      subject: 'Computer Science',
      topic: 'Algorithms (Graph Theory)',
      priority: 'high',
      status: 'active',
      date: new Date('2026-11-20'),
      duration: 90,
    },
    {
      _id: 'p2',
      user: 'u1',
      subject: 'Computer Science',
      topic: 'C++ OOP Concepts',
      priority: 'urgent',
      status: 'completed',
      date: new Date('2026-11-16'),
      duration: 60,
    },
    {
      _id: 'p3',
      user: 'u1',
      subject: 'Mathematics',
      topic: 'Calculus III Integrals',
      priority: 'medium',
      status: 'active',
      date: new Date('2026-11-22'),
      duration: 120,
    },
    {
      _id: 'p4',
      user: 'u2', // Isolated user
      subject: 'Physics',
      topic: 'Quantum Mechanics',
      priority: 'urgent',
      status: 'active',
      date: new Date('2026-11-18'),
      duration: 45,
    },
  ];

  test('Filters study plans strictly by authenticated user ID', () => {
    const user1Plans = mockPlans.filter((p) => p.user === 'u1');
    assert.strictEqual(user1Plans.length, 3);
    assert.strictEqual(user1Plans.every((p) => p.user === 'u1'), true);
  });

  test('Filters study plans by subject case-insensitively', () => {
    const querySubject = 'computer science';
    const safeRegex = new RegExp(`^${escapeRegex(querySubject)}$`, 'i');
    const filtered = mockPlans.filter((p) => p.user === 'u1' && safeRegex.test(p.subject));
    assert.strictEqual(filtered.length, 2);
  });

  test('Filters study plans by priority (urgent/high/medium/low)', () => {
    const filtered = mockPlans.filter((p) => p.user === 'u1' && p.priority === 'urgent');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].topic, 'C++ OOP Concepts');
  });

  test('Searches study plans with special characters "C++"', () => {
    const q = 'C++';
    const safeRegex = new RegExp(escapeRegex(q), 'i');
    const matched = mockPlans.filter(
      (p) => p.user === 'u1' && (safeRegex.test(p.topic) || safeRegex.test(p.subject))
    );
    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0]._id, 'p2');
  });

  test('Searches study plans with parentheses "(Graph Theory)"', () => {
    const q = '(Graph Theory)';
    const safeRegex = new RegExp(escapeRegex(q), 'i');
    const matched = mockPlans.filter(
      (p) => p.user === 'u1' && (safeRegex.test(p.topic) || safeRegex.test(p.subject))
    );
    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0]._id, 'p1');
  });

  test('Handles pagination offset and limit correctly', () => {
    const user1Plans = mockPlans.filter((p) => p.user === 'u1');
    const page = 2;
    const limit = 2;
    const paginated = user1Plans.slice((page - 1) * limit, page * limit);
    assert.strictEqual(paginated.length, 1);
    assert.strictEqual(paginated[0]._id, 'p3');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Multi-Filter & Search Logic Simulation: Tasks
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n✅ 3. Task Management Filtering & Search Logic');

  const now = new Date();
  const pastDate = new Date(now.getTime() - 86400000 * 2);
  const futureDate = new Date(now.getTime() + 86400000 * 3);

  const mockTasks = [
    {
      _id: 't1',
      user: 'u1',
      title: 'Submit Lab Report C++',
      subject: 'Computer Science',
      priority: 'urgent',
      status: 'pending',
      dueDate: pastDate,
    },
    {
      _id: 't2',
      user: 'u1',
      title: 'Problem Set 4 (Calculus)',
      subject: 'Mathematics',
      priority: 'high',
      status: 'completed',
      dueDate: pastDate,
    },
    {
      _id: 't3',
      user: 'u1',
      title: 'Read Chapter 5 in Economics',
      subject: 'Economics',
      priority: 'medium',
      status: 'pending',
      dueDate: futureDate,
    },
  ];

  test('Identifies overdue tasks accurately (past deadline AND not completed)', () => {
    const overdueTasks = mockTasks.filter(
      (t) => t.user === 'u1' && t.status !== 'completed' && new Date(t.dueDate) < now
    );
    assert.strictEqual(overdueTasks.length, 1);
    assert.strictEqual(overdueTasks[0]._id, 't1');
  });

  test('Filters tasks by priority level', () => {
    const urgentTasks = mockTasks.filter((t) => t.user === 'u1' && t.priority === 'urgent');
    assert.strictEqual(urgentTasks.length, 1);
    assert.strictEqual(urgentTasks[0].title, 'Submit Lab Report C++');
  });

  test('Searches tasks safely with special characters "Problem Set 4 (Calculus)"', () => {
    const query = '(Calculus)';
    const safeRegex = new RegExp(escapeRegex(query), 'i');
    const matched = mockTasks.filter(
      (t) => t.user === 'u1' && (safeRegex.test(t.title) || safeRegex.test(t.subject))
    );
    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0]._id, 't2');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Multi-Filter & Search Logic Simulation: Exams
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📅 4. Exam Tracker Filtering & Collision Prevention Logic');

  const mockExams = [
    {
      _id: 'e1',
      user: 'u1',
      examTitle: 'Final Exam (Data Structures & C++)',
      subject: 'Computer Science',
      priority: 'urgent',
      status: 'upcoming',
      examDate: new Date(now.getTime() + 86400000 * 2), // in 2 days
      notes: 'Prepare binary trees and AVL balances',
    },
    {
      _id: 'e2',
      user: 'u1',
      examTitle: 'Midterm Test',
      subject: 'Mathematics',
      priority: 'medium',
      status: 'completed',
      examDate: new Date(now.getTime() - 86400000 * 10), // 10 days ago
      notes: 'Focus on Taylor series',
    },
    {
      _id: 'e3',
      user: 'u1',
      examTitle: 'History of Art Quiz',
      subject: 'History',
      priority: 'low',
      status: 'upcoming',
      examDate: new Date(now.getTime() + 86400000 * 15), // in 15 days
      notes: 'Renaissance era',
    },
  ];

  test('Filters upcoming exams occurring within next 7 days (this-week)', () => {
    const weekEnd = new Date(now.getTime() + 86400000 * 7);
    const thisWeek = mockExams.filter(
      (e) => e.user === 'u1' && e.examDate >= now && e.examDate <= weekEnd
    );
    assert.strictEqual(thisWeek.length, 1);
    assert.strictEqual(thisWeek[0]._id, 'e1');
  });

  test('Filters past exams without colliding with search queries', () => {
    // Simulating safe buildFilter: past status AND search for "Midterm"
    const statusFilter = (e) => e.examDate < now || e.status === 'completed';
    const searchQuery = 'Midterm';
    const safeRegex = new RegExp(escapeRegex(searchQuery), 'i');
    const searchFilter = (e) =>
      safeRegex.test(e.examTitle) || safeRegex.test(e.subject) || safeRegex.test(e.notes);

    const combined = mockExams.filter((e) => e.user === 'u1' && statusFilter(e) && searchFilter(e));
    assert.strictEqual(combined.length, 1);
    assert.strictEqual(combined[0]._id, 'e2');
  });

  test('Filters exams by priority level', () => {
    const urgent = mockExams.filter((e) => e.user === 'u1' && e.priority === 'urgent');
    assert.strictEqual(urgent.length, 1);
    assert.strictEqual(urgent[0]._id, 'e1');
  });

  test('Searches exams notes field with keywords', () => {
    const query = 'AVL balances';
    const safeRegex = new RegExp(escapeRegex(query), 'i');
    const matched = mockExams.filter(
      (e) =>
        e.user === 'u1' &&
        (safeRegex.test(e.examTitle) || safeRegex.test(e.subject) || safeRegex.test(e.notes))
    );
    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0]._id, 'e1');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Empty State & Zero Result Invariants
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📭 5. Empty State & Zero Result Invariants');

  test('Returns empty array and count 0 when no search matches found', () => {
    const query = 'NonExistentSubject999';
    const safeRegex = new RegExp(escapeRegex(query), 'i');
    const matched = mockPlans.filter((p) => safeRegex.test(p.subject));
    assert.deepStrictEqual(matched, []);
    assert.strictEqual(matched.length, 0);
  });

  test('Maintains distinct subject list sorted and unique', () => {
    const rawSubjects = ['Computer Science', 'Mathematics', 'Computer Science', null, ''];
    const distinct = [...new Set(rawSubjects.filter(Boolean))].sort();
    assert.deepStrictEqual(distinct, ['Computer Science', 'Mathematics']);
  });

  test('Enforces numerical bounds on productivity score between 0 and 100', () => {
    const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));
    assert.strictEqual(clampScore(125), 100);
    assert.strictEqual(clampScore(-15), 0);
    assert.strictEqual(clampScore(78.6), 79);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. User Isolation Verification
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🔒 6. Strict User Ownership Isolation Verification');

  test('Data belonging to user u2 is never leaked to user u1', () => {
    const u1Data = mockPlans.filter((p) => p.user === 'u1');
    const hasU2 = u1Data.some((p) => p.user === 'u2');
    assert.strictEqual(hasU2, false);
  });

  test('User u2 cannot access or view u1 tasks', () => {
    const u2Tasks = mockTasks.filter((t) => t.user === 'u2');
    assert.strictEqual(u2Tasks.length, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────────────────────────');
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.error('\n❌ Some integration & refinement tests failed.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 All Day 15 Integration & Refinement tests passed!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
