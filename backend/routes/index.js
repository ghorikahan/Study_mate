const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const studyPlanRoutes = require('./studyPlanRoutes');
const taskRoutes = require('./taskRoutes');
const timetableRoutes = require('./timetableRoutes');

// Mount routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/study-plans', studyPlanRoutes);
router.use('/tasks', taskRoutes);
router.use('/timetable', timetableRoutes);

module.exports = router;

