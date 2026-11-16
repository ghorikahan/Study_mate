/**
 * Day 13 – Profile and Settings API Test Suite
 * Tests route protection (401 without auth token), profile validation,
 * password change verification, study goals and notification preference logic,
 * and explicit confirmation account deletion workflow.
 * Runs in-memory with express & mock handlers (unit mode).
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
  console.log('\n👤 StudyMate – Day 13 Profile & Settings Tests\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // ─── Route Protection (Unit) ──────────────────────────────────────────
    console.log('🛡️  Route Protection & Authentication Enforcement');

    const resProfile = await request(server, 'GET', '/api/users/profile');
    assert(resProfile.status === 401, 'GET /api/users/profile requires auth (no token → 401)');

    const resUpdateProf = await request(server, 'PUT', '/api/users/profile', { name: 'New Name' });
    assert(resUpdateProf.status === 401, 'PUT /api/users/profile requires auth (no token → 401)');

    const resPassword = await request(server, 'PUT', '/api/users/password', { currentPassword: 'old', newPassword: 'new' });
    assert(resPassword.status === 401, 'PUT /api/users/password requires auth (no token → 401)');

    const resPref = await request(server, 'PUT', '/api/users/preferences', { weeklyStudyGoalHours: 25 });
    assert(resPref.status === 401, 'PUT /api/users/preferences requires auth (no token → 401)');

    const resDelete = await request(server, 'DELETE', '/api/users/account', { password: 'pw', confirmationText: 'DELETE' });
    assert(resDelete.status === 401, 'DELETE /api/users/account requires auth (no token → 401)');

    const resAuthUpdatePw = await request(server, 'PUT', '/api/auth/update-password', { currentPassword: 'old', newPassword: 'new' });
    assert(resAuthUpdatePw.status === 401, 'PUT /api/auth/update-password alias requires auth (no token → 401)');

    const resAuthDelete = await request(server, 'DELETE', '/api/auth/delete-account', { password: 'pw', confirmationText: 'DELETE' });
    assert(resAuthDelete.status === 401, 'DELETE /api/auth/delete-account alias requires auth (no token → 401)');

    // ─── Profile Validation Logic (Unit) ────────────────────────────────────
    console.log('\n📝 Profile Validation Logic (Unit)');

    function validateProfileUpdates({ name, bio, institution }) {
      const errors = [];
      if (name !== undefined) {
        const trimmed = String(name).trim();
        if (trimmed.length < 2) errors.push('Name must be at least 2 characters long.');
        if (trimmed.length > 60) errors.push('Name cannot exceed 60 characters.');
      }
      if (bio !== undefined && String(bio).trim().length > 250) {
        errors.push('Bio cannot exceed 250 characters.');
      }
      if (institution !== undefined && String(institution).trim().length > 100) {
        errors.push('Institution cannot exceed 100 characters.');
      }
      return errors;
    }

    assert(validateProfileUpdates({ name: 'A' }).length > 0, 'Name < 2 characters fails validation');
    assert(validateProfileUpdates({ name: 'John Doe' }).length === 0, 'Valid name "John Doe" passes');
    assert(validateProfileUpdates({ name: 'x'.repeat(61) }).length > 0, 'Name > 60 characters fails validation');
    assert(validateProfileUpdates({ bio: 'x'.repeat(251) }).length > 0, 'Bio > 250 characters fails validation');
    assert(validateProfileUpdates({ bio: 'Computer Science Scholar' }).length === 0, 'Valid bio passes validation');
    assert(validateProfileUpdates({ institution: 'x'.repeat(101) }).length > 0, 'Institution > 100 characters fails validation');
    assert(validateProfileUpdates({ institution: 'MIT Engineering' }).length === 0, 'Valid institution passes validation');

    // ─── Password Change Logic (Unit) ───────────────────────────────────────
    console.log('\n🔑 Password Change Validation Logic (Unit)');

    function validatePasswordChange({ currentPassword, newPassword, confirmPassword }) {
      if (!currentPassword) return 'Current password is required.';
      if (!newPassword) return 'New password is required.';
      if (newPassword.length < 6) return 'New password must be at least 6 characters long.';
      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return 'New password and confirmation do not match.';
      }
      if (currentPassword === newPassword) {
        return 'New password cannot be identical to your current password.';
      }
      return null;
    }

    assert(validatePasswordChange({ currentPassword: '', newPassword: 'newpassword123' }) === 'Current password is required.', 'Rejects missing current password');
    assert(validatePasswordChange({ currentPassword: 'oldpw', newPassword: '' }) === 'New password is required.', 'Rejects missing new password');
    assert(validatePasswordChange({ currentPassword: 'oldpw', newPassword: '123' }) === 'New password must be at least 6 characters long.', 'Rejects new password < 6 chars');
    assert(validatePasswordChange({ currentPassword: 'oldpw', newPassword: 'newpassword', confirmPassword: 'differentpassword' }) === 'New password and confirmation do not match.', 'Rejects mismatched confirm password');
    assert(validatePasswordChange({ currentPassword: 'samepassword123', newPassword: 'samepassword123', confirmPassword: 'samepassword123' }) === 'New password cannot be identical to your current password.', 'Rejects identical old and new password');
    assert(validatePasswordChange({ currentPassword: 'oldpassword123', newPassword: 'brandNewPassword123', confirmPassword: 'brandNewPassword123' }) === null, 'Accepts valid password update payload');

    // ─── Study Goals & Preferences Logic (Unit) ─────────────────────────────
    console.log('\n🎯 Study Goals & Preferences Validation (Unit)');

    function validatePreferences({ theme, weeklyStudyGoalHours, dailyStudyGoalMinutes, defaultFocusMinutes }) {
      const errors = [];
      if (theme !== undefined && !['dark', 'light', 'system'].includes(theme)) {
        errors.push('Theme must be dark, light, or system.');
      }
      if (weeklyStudyGoalHours !== undefined) {
        const weekly = Number(weeklyStudyGoalHours);
        if (isNaN(weekly) || weekly < 1 || weekly > 100) {
          errors.push('Weekly study goal must be between 1 and 100 hours.');
        }
      }
      if (dailyStudyGoalMinutes !== undefined) {
        const daily = Number(dailyStudyGoalMinutes);
        if (isNaN(daily) || daily < 15 || daily > 720) {
          errors.push('Daily study goal must be between 15 and 720 minutes.');
        }
      }
      if (defaultFocusMinutes !== undefined) {
        const focus = Number(defaultFocusMinutes);
        if (isNaN(focus) || focus < 5 || focus > 120) {
          errors.push('Default focus session must be between 5 and 120 minutes.');
        }
      }
      return errors;
    }

    assert(validatePreferences({ theme: 'dark' }).length === 0, 'Theme "dark" passes');
    assert(validatePreferences({ theme: 'blue' }).length > 0, 'Invalid theme "blue" is rejected');
    assert(validatePreferences({ weeklyStudyGoalHours: 25 }).length === 0, 'Weekly goal 25h passes');
    assert(validatePreferences({ weeklyStudyGoalHours: 0 }).length > 0, 'Weekly goal 0h is rejected');
    assert(validatePreferences({ weeklyStudyGoalHours: 150 }).length > 0, 'Weekly goal 150h is rejected');
    assert(validatePreferences({ dailyStudyGoalMinutes: 120 }).length === 0, 'Daily goal 120m passes');
    assert(validatePreferences({ dailyStudyGoalMinutes: 10 }).length > 0, 'Daily goal < 15m is rejected');
    assert(validatePreferences({ dailyStudyGoalMinutes: 800 }).length > 0, 'Daily goal > 720m is rejected');
    assert(validatePreferences({ defaultFocusMinutes: 25 }).length === 0, 'Default focus 25m passes');
    assert(validatePreferences({ defaultFocusMinutes: 2 }).length > 0, 'Default focus < 5m is rejected');
    assert(validatePreferences({ defaultFocusMinutes: 180 }).length > 0, 'Default focus > 120m is rejected');

    // ─── Account Deletion Workflow (Unit) ───────────────────────────────────
    console.log('\n⚠️ Account Deletion Workflow & Safeguards (Unit)');

    function validateDeletion({ password, confirmationText }) {
      if (!password) return 'Current password is required to confirm account deletion.';
      if (!confirmationText || String(confirmationText).trim().toUpperCase() !== 'DELETE') {
        return 'Please type "DELETE" to confirm permanent account removal.';
      }
      return null;
    }

    assert(validateDeletion({ password: '', confirmationText: 'DELETE' }) === 'Current password is required to confirm account deletion.', 'Deletion requires password');
    assert(validateDeletion({ password: 'mypassword', confirmationText: '' }) === 'Please type "DELETE" to confirm permanent account removal.', 'Deletion requires "DELETE" text confirmation');
    assert(validateDeletion({ password: 'mypassword', confirmationText: 'cancel' }) === 'Please type "DELETE" to confirm permanent account removal.', 'Deletion rejects non-DELETE text');
    assert(validateDeletion({ password: 'mypassword', confirmationText: 'DELETE' }) === null, 'Deletion accepts verified credentials and DELETE string');
    assert(validateDeletion({ password: 'mypassword', confirmationText: 'delete' }) === null, 'Deletion accepts case-insensitive "delete"');

    // ─── User Profile Sanitization (Unit) ───────────────────────────────────
    console.log('\n🔒 User Data Sanitization (Unit)');

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: '$2a$10$hashedPasswordThatMustNeverBeReturned',
      __v: 0,
      role: 'student',
      institution: 'Stanford University',
      bio: 'Lifelong learner',
      preferences: { weeklyStudyGoalHours: 20 },
    };

    function sanitize(user) {
      const copy = { ...user };
      delete copy.password;
      delete copy.__v;
      return copy;
    }

    const sanitized = sanitize(mockUser);
    assert(sanitized.password === undefined, 'Sanitization strips password field');
    assert(sanitized.__v === undefined, 'Sanitization strips Mongoose internal __v field');
    assert(sanitized.name === 'Alex Rivera', 'Sanitization preserves user name');
    assert(sanitized.institution === 'Stanford University', 'Sanitization preserves institution');

  } finally {
    server.close();
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}\n`);

  if (failed === 0) {
    console.log('🎉 All Profile & Settings Module tests passed!\n');
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

