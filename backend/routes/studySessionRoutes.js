const express = require('express');
const router = express.Router();

const { protect } = require('../middleware');
const {
  createStudySession,
  getStudySessions,
  getStudySessionStats,
  getStudySessionById,
  deleteStudySession,
} = require('../controllers/studySessionController');

// All focus timer & study session routes require authentication
router.use(protect);

router.route('/')
  .get(getStudySessions)
  .post(createStudySession);

router.get('/stats', getStudySessionStats);

router.route('/:id')
  .get(getStudySessionById)
  .delete(deleteStudySession);

module.exports = router;
