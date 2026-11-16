const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const studyPlanRoutes = require('./studyPlanRoutes');
const taskRoutes = require('./taskRoutes');
const timetableRoutes = require('./timetableRoutes');
const examRoutes = require('./examRoutes');
const studySessionRoutes = require('./studySessionRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const userRoutes = require('./userRoutes');
const notificationRoutes = require('./notificationRoutes');

// Mount routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/study-plans', studyPlanRoutes);
router.use('/tasks', taskRoutes);
router.use('/timetable', timetableRoutes);
router.use('/exams', examRoutes);
router.use('/study-sessions', studySessionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

