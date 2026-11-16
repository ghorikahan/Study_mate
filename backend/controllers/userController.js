const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const Task = require('../models/Task');
const Exam = require('../models/Exam');
const StudySession = require('../models/StudySession');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/responseHandler');

/**
 * Helper to sanitize user object
 */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject({ virtuals: false }) : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/profile
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User account not found.', 404));
  }

  // Aggregate user study stats
  const [
    plansCount,
    tasksCount,
    completedTasksCount,
    examsCount,
    sessionsCount,
    studyHoursAgg,
  ] = await Promise.all([
    StudyPlan.countDocuments({ user: req.user._id }),
    Task.countDocuments({ user: req.user._id }),
    Task.countDocuments({ user: req.user._id, status: 'completed' }),
    Exam.countDocuments({ user: req.user._id }),
    StudySession.countDocuments({ user: req.user._id }),
    StudySession.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
    ]),
  ]);

  const totalMinutes = studyHoursAgg[0]?.totalMinutes || 0;
  const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

  const stats = {
    plansCount,
    tasksCount,
    completedTasksCount,
    examsCount,
    sessionsCount,
    totalStudyHours,
    currentStreak: user.studyStreak?.currentStreak || 0,
    longestStreak: user.studyStreak?.longestStreak || 0,
  };

  return successResponse(res, {
    statusCode: 200,
    message: 'User profile and statistics retrieved successfully.',
    data: {
      user: sanitizeUser(user),
      stats,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/profile
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, bio, institution, avatar } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2) {
      return next(new AppError('Name must be at least 2 characters long.', 400));
    }
    if (trimmed.length > 60) {
      return next(new AppError('Name cannot exceed 60 characters.', 400));
    }
    user.name = trimmed;
  }

  if (bio !== undefined) {
    const trimmedBio = String(bio).trim();
    if (trimmedBio.length > 250) {
      return next(new AppError('Bio cannot exceed 250 characters.', 400));
    }
    user.bio = trimmedBio;
  }

  if (institution !== undefined) {
    const trimmedInst = String(institution).trim();
    if (trimmedInst.length > 100) {
      return next(new AppError('Institution cannot exceed 100 characters.', 400));
    }
    user.institution = trimmedInst;
  }

  if (avatar !== undefined) {
    user.avatar = avatar ? String(avatar).trim() : null;
  }

  await user.save();

  return successResponse(res, {
    statusCode: 200,
    message: 'Profile updated successfully.',
    data: {
      user: sanitizeUser(user),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/password (and /api/auth/update-password)
// ─────────────────────────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    return next(new AppError('Current password is required.', 400));
  }

  if (!newPassword) {
    return next(new AppError('New password is required.', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long.', 400));
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return next(new AppError('New password and confirmation do not match.', 400));
  }

  if (currentPassword === newPassword) {
    return next(new AppError('New password cannot be identical to your current password.', 400));
  }

  // Fetch user including password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  // Assign new password; pre-save hook handles hashing
  user.password = newPassword;
  await user.save();

  return successResponse(res, {
    statusCode: 200,
    message: 'Password changed successfully. Please remember your new password.',
    data: {
      user: sanitizeUser(user),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/preferences
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePreferences = asyncHandler(async (req, res, next) => {
  const {
    theme,
    weeklyStudyGoalHours,
    dailyStudyGoalMinutes,
    defaultFocusMinutes,
    notifications,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (!user.preferences) {
    user.preferences = {};
  }

  if (theme !== undefined) {
    if (!['dark', 'light', 'system'].includes(theme)) {
      return next(new AppError('Theme must be dark, light, or system.', 400));
    }
    user.preferences.theme = theme;
  }

  if (weeklyStudyGoalHours !== undefined) {
    const weekly = Number(weeklyStudyGoalHours);
    if (isNaN(weekly) || weekly < 1 || weekly > 100) {
      return next(new AppError('Weekly study goal must be between 1 and 100 hours.', 400));
    }
    user.preferences.weeklyStudyGoalHours = Math.round(weekly);
  }

  if (dailyStudyGoalMinutes !== undefined) {
    const daily = Number(dailyStudyGoalMinutes);
    if (isNaN(daily) || daily < 15 || daily > 720) {
      return next(new AppError('Daily study goal must be between 15 and 720 minutes.', 400));
    }
    user.preferences.dailyStudyGoalMinutes = Math.round(daily);
  }

  if (defaultFocusMinutes !== undefined) {
    const focus = Number(defaultFocusMinutes);
    if (isNaN(focus) || focus < 5 || focus > 120) {
      return next(new AppError('Default focus session must be between 5 and 120 minutes.', 400));
    }
    user.preferences.defaultFocusMinutes = Math.round(focus);
  }

  if (notifications && typeof notifications === 'object') {
    if (!user.preferences.notifications) {
      user.preferences.notifications = {};
    }

    if (typeof notifications.email === 'boolean') {
      user.preferences.notifications.email = notifications.email;
    }
    if (typeof notifications.push === 'boolean') {
      user.preferences.notifications.push = notifications.push;
    }
    if (typeof notifications.examReminders === 'boolean') {
      user.preferences.notifications.examReminders = notifications.examReminders;
    }
    if (typeof notifications.dailyPlanSummary === 'boolean') {
      user.preferences.notifications.dailyPlanSummary = notifications.dailyPlanSummary;
    }
    if (typeof notifications.taskReminders === 'boolean') {
      user.preferences.notifications.taskReminders = notifications.taskReminders;
    }
    if (typeof notifications.soundEnabled === 'boolean') {
      user.preferences.notifications.soundEnabled = notifications.soundEnabled;
    }
  }

  user.markModified('preferences');
  await user.save();

  return successResponse(res, {
    statusCode: 200,
    message: 'Preferences updated successfully.',
    data: {
      user: sanitizeUser(user),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/account (and /api/auth/delete-account)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password, confirmationText } = req.body;

  if (!password) {
    return next(new AppError('Current password is required to confirm account deletion.', 400));
  }

  if (!confirmationText || String(confirmationText).trim().toUpperCase() !== 'DELETE') {
    return next(new AppError('Please type "DELETE" to confirm permanent account removal.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Incorrect password. Account deletion aborted for security.', 401));
  }

  const userId = req.user._id;

  // Cascade delete all related student data
  const [plans, tasks, exams, sessions, timetable, notifications] = await Promise.all([
    StudyPlan.deleteMany({ user: userId }),
    Task.deleteMany({ user: userId }),
    Exam.deleteMany({ user: userId }),
    StudySession.deleteMany({ user: userId }),
    Timetable.deleteMany({ user: userId }),
    Notification.deleteMany({ user: userId }),
  ]);

  // Finally delete the user account
  await User.findByIdAndDelete(userId);

  return successResponse(res, {
    statusCode: 200,
    message: 'Your StudyMate account and all related study data have been permanently deleted.',
    data: {
      deletedAt: new Date().toISOString(),
      cascadeSummary: {
        plansDeleted: plans.deletedCount || 0,
        tasksDeleted: tasks.deletedCount || 0,
        examsDeleted: exams.deletedCount || 0,
        sessionsDeleted: sessions.deletedCount || 0,
        timetableDeleted: timetable.deletedCount || 0,
        notificationsDeleted: notifications.deletedCount || 0,
      },
    },
  });
});

