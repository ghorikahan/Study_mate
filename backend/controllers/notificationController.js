const Notification = require('../models/Notification');
const Exam = require('../models/Exam');
const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/responseHandler');

/**
 * Format date to YYYY-MM-DD
 */
const toDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────────────────────────────────────
exports.getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, type, limit = 50, page = 1 } = req.query;

  const query = { user: req.user._id };

  if (unreadOnly === 'true' || unreadOnly === true) {
    query.isRead = false;
  }

  if (type && type !== 'all') {
    query.type = type;
  }

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return successResponse(res, {
    statusCode: 200,
    message: 'Notifications retrieved successfully.',
    data: {
      notifications,
      total,
      unreadCount,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return next(new AppError('Notification not found or access denied.', 404));
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  return successResponse(res, {
    statusCode: 200,
    message: 'Notification marked as read.',
    data: {
      notification,
      unreadCount,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
// ─────────────────────────────────────────────────────────────────────────────
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return successResponse(res, {
    statusCode: 200,
    message: 'All notifications marked as read.',
    data: {
      modifiedCount: result.modifiedCount || 0,
      unreadCount: 0,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return next(new AppError('Notification not found or access denied.', 404));
  }

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  return successResponse(res, {
    statusCode: 200,
    message: 'Notification deleted.',
    data: {
      deletedId: req.params.id,
      unreadCount,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications
// ─────────────────────────────────────────────────────────────────────────────
exports.clearAll = asyncHandler(async (req, res) => {
  const { readOnly } = req.query;

  const query = { user: req.user._id };
  if (readOnly === 'true' || readOnly === true) {
    query.isRead = true;
  }

  const result = await Notification.deleteMany(query);

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  return successResponse(res, {
    statusCode: 200,
    message: 'Notifications cleared successfully.',
    data: {
      deletedCount: result.deletedCount || 0,
      unreadCount,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/generate-reminders
// Scans upcoming exams (≤ 3 days), tasks due today/overdue, and daily streak,
// creating duplicate-safe in-app notification records respecting user preferences.
// ─────────────────────────────────────────────────────────────────────────────
exports.generateReminders = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const prefs = user?.preferences?.notifications || {};

  const today = new Date();
  const todayStr = toDateString(today);
  const threeDaysAhead = new Date();
  threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);
  threeDaysAhead.setHours(23, 59, 59, 999);

  const createdNotifications = [];

  // 1. Upcoming Exam Reminders (if enabled)
  if (prefs.examReminders !== false) {
    const upcomingExams = await Exam.find({
      user: req.user._id,
      status: 'upcoming',
      examDate: { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: threeDaysAhead },
    });

    for (const exam of upcomingExams) {
      const examDate = new Date(exam.examDate);
      const diffTime = examDate.getTime() - new Date().setHours(0, 0, 0, 0);
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const dedupKey = `exam_${exam._id}_${todayStr}`;
      const existing = await Notification.findOne({
        user: req.user._id,
        dedupKey,
      });

      if (!existing) {
        let urgencyText = daysRemaining === 0 ? 'is TODAY!' : `is in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}!`;
        const notif = await Notification.create({
          user: req.user._id,
          title: `Exam Alert: ${exam.examTitle}`,
          message: `Your ${exam.subject} exam ${urgencyText} Review syllabus topics and prepare now.`,
          type: 'exam_reminder',
          priority: daysRemaining <= 1 ? 'high' : 'medium',
          relatedModel: 'Exam',
          relatedId: exam._id,
          dedupKey,
          scheduledFor: new Date(),
        });
        createdNotifications.push(notif);
      }
    }
  }

  // 2. Task Deadlines (if enabled)
  if (prefs.taskReminders !== false) {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const pendingTasks = await Task.find({
      user: req.user._id,
      status: 'pending',
      dueDate: { $lte: endOfToday },
    });

    for (const task of pendingTasks) {
      const isOverdue = new Date(task.dueDate) < new Date();
      const dedupKey = `task_${task._id}_${todayStr}`;
      const existing = await Notification.findOne({
        user: req.user._id,
        dedupKey,
      });

      if (!existing) {
        const notif = await Notification.create({
          user: req.user._id,
          title: isOverdue ? `Overdue Task: ${task.title}` : `Task Due Today: ${task.title}`,
          message: isOverdue
            ? `Your task "${task.title}" (${task.subject}) was due on ${toDateString(task.dueDate)}. Complete it to stay on track!`
            : `Don't forget to complete "${task.title}" for ${task.subject} before end of day.`,
          type: 'task_deadline',
          priority: isOverdue ? 'high' : 'medium',
          relatedModel: 'Task',
          relatedId: task._id,
          dedupKey,
          scheduledFor: new Date(),
        });
        createdNotifications.push(notif);
      }
    }
  }

  // 3. Study Streak Milestone / Reminder (if enabled)
  if (prefs.dailyPlanSummary !== false) {
    const currentStreak = user?.studyStreak?.currentStreak || 0;
    const dedupKey = `streak_${req.user._id}_${todayStr}`;
    const existing = await Notification.findOne({
      user: req.user._id,
      dedupKey,
    });

    if (!existing && currentStreak > 0) {
      const notif = await Notification.create({
        user: req.user._id,
        title: `Keep Your ${currentStreak}-Day Streak Alive! 🔥`,
        message: `You've built great momentum with a ${currentStreak}-day study streak. Start a focus session today to keep it going!`,
        type: 'study_streak',
        priority: 'medium',
        relatedModel: null,
        relatedId: null,
        dedupKey,
        scheduledFor: new Date(),
      });
      createdNotifications.push(notif);
    }
  }

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  return successResponse(res, {
    statusCode: 200,
    message: `Generated ${createdNotifications.length} reminder notification(s).`,
    data: {
      generatedCount: createdNotifications.length,
      unreadCount,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications
// ─────────────────────────────────────────────────────────────────────────────
exports.createNotification = asyncHandler(async (req, res, next) => {
  const { title, message, type, priority, relatedModel, relatedId, dedupKey } = req.body;

  if (!title || !message) {
    return next(new AppError('Notification title and message are required.', 400));
  }

  if (dedupKey) {
    const existing = await Notification.findOne({
      user: req.user._id,
      dedupKey: String(dedupKey).trim(),
    });
    if (existing) {
      return successResponse(res, {
        statusCode: 200,
        message: 'Notification with this dedupKey already exists. Duplicate prevented.',
        data: { notification: existing, duplicated: true },
      });
    }
  }

  const notification = await Notification.create({
    user: req.user._id,
    title: title.trim(),
    message: message.trim(),
    type: type || 'system',
    priority: priority || 'medium',
    relatedModel: relatedModel || null,
    relatedId: relatedId || null,
    dedupKey: dedupKey ? String(dedupKey).trim() : null,
    scheduledFor: new Date(),
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Notification created successfully.',
    data: { notification },
  });
});
