const http = require('http');
const mongoose = require('mongoose');
const app = require('./server');
const { User, StudyPlan, Task, Exam, StudySession, Notification } = require('./models');
const { validate } = require('./middleware/validator');
const AppError = require('./utils/appError');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, testName) => {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
};

const makeRequest = (server, path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;

    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runAllTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 STUDYMATE DAY 3 BACKEND FOUNDATION TEST SUITE');
  console.log('======================================================\n');

  // -----------------------------------------------------------
  // TEST GROUP 1: Mongoose Schemas & Models Verification
  // -----------------------------------------------------------
  console.log('📦 GROUP 1: Mongoose Models & Schemas');

  assert(User && User.modelName === 'User', 'User model is properly registered with Mongoose');
  assert(StudyPlan && StudyPlan.modelName === 'StudyPlan', 'StudyPlan model is properly registered with Mongoose');
  assert(Task && Task.modelName === 'Task', 'Task model is properly registered with Mongoose');
  assert(Exam && Exam.modelName === 'Exam', 'Exam model is properly registered with Mongoose');
  assert(StudySession && StudySession.modelName === 'StudySession', 'StudySession model is properly registered with Mongoose');
  assert(Notification && Notification.modelName === 'Notification', 'Notification model is properly registered with Mongoose');

  // Verify User schema validation
  const invalidUser = new User({});
  const userValidationErr = invalidUser.validateSync();
  assert(userValidationErr && userValidationErr.errors.name, 'User schema enforces required name');
  assert(userValidationErr && userValidationErr.errors.email, 'User schema enforces required email');
  assert(userValidationErr && userValidationErr.errors.password, 'User schema enforces required password');

  // Verify User comparePassword method exists
  const dummyUser = new User({ name: 'Alex', email: 'alex@test.com', password: 'password123' });
  assert(typeof dummyUser.comparePassword === 'function', 'User instance includes comparePassword method');

  // Verify Task schema validation & virtuals
  const invalidTask = new Task({});
  const taskValidationErr = invalidTask.validateSync();
  assert(taskValidationErr && taskValidationErr.errors.user, 'Task schema enforces required user');
  assert(taskValidationErr && taskValidationErr.errors.title, 'Task schema enforces required title');
  assert(taskValidationErr && taskValidationErr.errors.dueDate, 'Task schema enforces required dueDate');

  const validTask = new Task({
    user: new mongoose.Types.ObjectId(),
    title: 'Study Chapter 4 Algorithms',
    subject: 'Computer Science',
    dueDate: new Date(Date.now() - 3600000), // 1 hour ago
  });
  assert(validTask.isOverdue === true, 'Task virtual property "isOverdue" correctly identifies overdue task');

  // Verify Exam schema validation & virtuals
  const validExam = new Exam({
    user: new mongoose.Types.ObjectId(),
    examTitle: 'Data Structures Final',
    subject: 'CS201',
    examDate: new Date(Date.now() + 5 * 24 * 3600 * 1000), // in 5 days
    syllabusTopics: [
      { topicName: 'Arrays', isCovered: true },
      { topicName: 'Trees', isCovered: true },
      { topicName: 'Graphs', isCovered: false },
      { topicName: 'Hashing', isCovered: false },
    ],
  });
  assert(validExam.daysRemaining === 5 || validExam.daysRemaining === 6, 'Exam virtual "daysRemaining" calculates correct countdown');
  assert(validExam.syllabusProgressPercent === 50, 'Exam virtual "syllabusProgressPercent" accurately calculates topic coverage (50%)');

  // Verify StudyPlan schema virtuals
  const validPlan = new StudyPlan({
    user: new mongoose.Types.ObjectId(),
    title: 'Midterm Prep',
    subject: 'Physics',
    targetCompletionDate: new Date(),
    totalEstimatedHours: 20,
    completedHours: 10,
  });
  assert(validPlan.progressPercent === 50, 'StudyPlan virtual "progressPercent" computes percentage accurately');

  // Verify Notification schema
  const invalidNotification = new Notification({});
  const notifErr = invalidNotification.validateSync();
  assert(notifErr && notifErr.errors.title && notifErr.errors.message, 'Notification requires title and message');

  // Verify StudySession schema
  const invalidSession = new StudySession({});
  const sessionErr = invalidSession.validateSync();
  assert(sessionErr && sessionErr.errors.subject && sessionErr.errors.durationMinutes, 'StudySession requires subject and durationMinutes');

  console.log('\n------------------------------------------------------');
  console.log('🌐 GROUP 2: HTTP Server & Health Endpoints');
  console.log('------------------------------------------------------');

  // Start HTTP server on random available port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`  ℹ️ Test server listening on ephemeral port ${port}`);

  try {
    // 1. Root Endpoint GET /
    const rootRes = await makeRequest(server, '/');
    assert(rootRes.status === 200, 'GET / returns HTTP 200 OK');
    assert(rootRes.body.success === true, 'GET / returns success: true');
    assert(rootRes.body.data && rootRes.body.data.app, 'GET / returns app title metadata');
    assert(rootRes.body.data.endpoints.health === '/api/health', 'GET / advertises /api/health endpoint');

    // 2. Health Endpoint GET /api/health
    const healthRes = await makeRequest(server, '/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200 OK');
    assert(healthRes.body.success === true, 'GET /api/health returns success: true');
    assert(healthRes.body.data.status === 'healthy', 'GET /api/health returns status: "healthy"');
    assert(healthRes.body.data.memory && healthRes.body.data.memory.rssMb, 'GET /api/health includes memory diagnostics');
    assert(healthRes.body.data.uptimeSeconds >= 0, 'GET /api/health includes uptime tracking');

    // 3. Database Status Endpoint GET /api/database-status
    const dbRes = await makeRequest(server, '/api/database-status');
    assert(dbRes.status === 200, 'GET /api/database-status returns HTTP 200 OK');
    assert(dbRes.body.success === true, 'GET /api/database-status returns success: true');
    assert(dbRes.body.data && typeof dbRes.body.data.isConnected === 'boolean', 'GET /api/database-status returns isConnected boolean');
    assert(Array.isArray(dbRes.body.data.registeredModels), 'GET /api/database-status lists registered Mongoose models');

    const models = dbRes.body.data.registeredModels;
    assert(
      ['User', 'StudyPlan', 'Task', 'Exam', 'StudySession', 'Notification'].every((m) => models.includes(m)),
      'Registered models list contains all 6 required StudyMate schemas'
    );

    // 4. 404 Route Handler
    const notFoundRes = await makeRequest(server, '/api/non-existent-route-xyz');
    assert(notFoundRes.status === 404, 'GET /api/non-existent-route returns HTTP 404');
    assert(notFoundRes.body.success === false, '404 handler returns standardized success: false format');
    assert(notFoundRes.body.message.includes('does not exist'), '404 message informs user of missing route');

    console.log('\n------------------------------------------------------');
    console.log('🛡️ GROUP 3: Middlewares & Centralized Error Handling');
    console.log('------------------------------------------------------');

    // Test Validation Middleware
    const testValidationSchema = {
      body: {
        title: { required: true, type: 'string', minLength: 3 },
        score: { required: true, type: 'number', min: 0, max: 100 },
      },
    };

    let nextError = null;
    const validatorFn = validate(testValidationSchema);

    // Failing validation test
    const mockReqFail = { body: { title: 'ab', score: 150 } };
    validatorFn(mockReqFail, {}, (err) => {
      nextError = err;
    });

    assert(nextError instanceof AppError, 'Validator forwards AppError instance on invalid input');
    assert(nextError.statusCode === 400, 'Validator sets statusCode: 400 for input errors');
    assert(nextError.errors && nextError.errors.title, 'Validator catches minLength error on title');
    assert(nextError.errors && nextError.errors.score, 'Validator catches max value error on score');

    // Passing validation test
    let passedValidation = false;
    const mockReqPass = { body: { title: 'Good Title', score: 95 } };
    validatorFn(mockReqPass, {}, (err) => {
      if (!err) passedValidation = true;
    });
    assert(passedValidation === true, 'Validator passes valid input to next() without error');
  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
  console.log('======================================================\n');
  process.exit(0);
};

runAllTests().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err.message);
  process.exit(1);
});

