const express = require('express');
const router = express.Router();
const { protect } = require('../middleware');
const {
  createEntry,
  getWeekEntries,
  getDayEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
} = require('../controllers/timetableController');

// All routes require authentication
router.use(protect);

// Weekly view & create
router.route('/').get(getWeekEntries).post(createEntry);

// Day view
router.get('/day', getDayEntries);

// Single-entry CRUD
router.route('/:id').get(getEntryById).put(updateEntry).delete(deleteEntry);

module.exports = router;
