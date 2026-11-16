const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware');

// All notification routes require authentication
router.use(protect);

// GET /api/notifications - List user notifications (with filters and unread count)
router.get('/', notificationController.getNotifications);

// POST /api/notifications/generate-reminders - Scan upcoming exams, tasks & streaks to generate notifications
router.post('/generate-reminders', notificationController.generateReminders);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', notificationController.deleteNotification);

// DELETE /api/notifications - Clear notifications (optionally ?readOnly=true)
router.delete('/', notificationController.clearAll);

// POST /api/notifications - Create notification manually
router.post('/', notificationController.createNotification);

module.exports = router;
