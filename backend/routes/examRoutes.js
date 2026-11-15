const express = require('express');
const router = express.Router();

const { protect } = require('../middleware');
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  toggleSyllabusTopic,
  deleteExam,
} = require('../controllers/examController');

// All routes require authentication
router.use(protect);

router.route('/').get(getExams).post(createExam);

router.route('/:id').get(getExamById).put(updateExam).delete(deleteExam);

router.patch('/:id/topics/:topicId', toggleSyllabusTopic);

module.exports = router;

