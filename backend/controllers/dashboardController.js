const mongoose = require('mongoose');
const { Task, Exam, StudySession, StudyPlan } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/responseHandler');

/**
 * GET /api/dashboard/summary
 * Returns comprehensive, real-time statistics calculated strictly from
 * the authenticated user's MongoDB records.
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // ─── Time Windows (Day & Week) ──────────────────────────────────────────────
  const now = new Date();

  // Start of today (00:00:00.000)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // End of today (23:59:59.999)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // 7 days ago (for weekly trend & goal calculation)
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // User preferences
  const weeklyGoalHours =
    req.user.preferences?.weeklyStudyGoalHours || 20;

  // ─── Parallel DB Queries ────────────────────────────────────────────────────
  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    todayTasksList,
    totalMinutesAgg,
    todayMinutesAgg,
    weeklyMinutesAgg,
    dailySessionsAgg,
    upcomingExamsList,
    totalUpcomingExams,
    activePlansCount,
  ] = await Promise.all([
    // 1. Task counts
    Task.countDocuments({ user: userId }),
    Task.countDocuments({ user: userId, status: 'completed' }),
    Task.countDocuments({ user: userId, status: { $ne: 'completed' } }),
    Task.countDocuments({
      user: userId,
      status: { $ne: 'completed' },
      dueDate: { $lt: startOfToday },
    }),

    // 2. Today's tasks (due today, or pending overdue tasks needing immediate focus)
    Task.find({
      user: userId,
      $or: [
        { dueDate: { $gte: startOfToday, $lte: endOfToday } },
        { dueDate: { $lt: startOfToday }, status: { $ne: 'completed' } },
      ],
    })
      .sort({ status: 1, priority: -1, dueDate: 1 })
      .limit(8)
      .lean(),

    // 3. Total study minutes across all time
    StudySession.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
    ]),

    // 4. Today's study minutes
    StudySession.aggregate([
      {
        $match: {
          user: userId,
          startTime: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
    ]),

    // 5. This week's study minutes (last 7 days)
    StudySession.aggregate([
      {
        $match: {
          user: userId,
          startTime: { $gte: sevenDaysAgo, $lte: endOfToday },
        },
      },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
    ]),

    // 6. 7-day daily breakdown
    StudySession.aggregate([
      {
        $match: {
          user: userId,
          startTime: { $gte: sevenDaysAgo, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
          },
          minutes: { $sum: '$durationMinutes' },
        },
      },
    ]),

    // 7. Upcoming exams (ordered by examDate ascending)
    Exam.find({
      user: userId,
      examDate: { $gte: startOfToday },
    })
      .sort({ examDate: 1 })
      .limit(4),

    // 8. Total count of upcoming exams
    Exam.countDocuments({
      user: userId,
      examDate: { $gte: startOfToday },
    }),

    // 9. Active study plans count
    StudyPlan.countDocuments({
      user: userId,
      status: 'active',
    }),
  ]);

  // ─── Process Study Minutes & Hours ──────────────────────────────────────────
  const totalMinutes = totalMinutesAgg[0]?.totalMinutes || 0;
  const todayMinutes = todayMinutesAgg[0]?.totalMinutes || 0;
  const weekMinutes = weeklyMinutesAgg[0]?.totalMinutes || 0;

  const todayHours = Number((todayMinutes / 60).toFixed(1));
  const weekHours = Number((weekMinutes / 60).toFixed(1));
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  const weeklyProgressPercent = Math.min(
    100,
    Math.round((weekHours / (weeklyGoalHours || 1)) * 100)
  );

  // ─── Format 7-Day Chart Data ────────────────────────────────────────────────
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyMap = new Map();

  dailySessionsAgg.forEach((item) => {
    dailyMap.set(item._id, item.minutes);
  });

  const weeklyBreakdown = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];
    const mins = dailyMap.get(dateKey) || 0;
    const hrs = Number((mins / 60).toFixed(1));

    weeklyBreakdown.push({
      date: dateKey,
      day: dayLabel,
      minutes: mins,
      hours: hrs,
      isToday: i === 0,
    });
  }

  // ─── Format Upcoming Exams (including virtuals) ─────────────────────────────
  const upcomingExams = upcomingExamsList.map((exam) => {
    const json = exam.toJSON();
    return {
      _id: json._id,
      examTitle: json.examTitle,
      subject: json.subject,
      examDate: json.examDate,
      startTime: json.startTime,
      durationMinutes: json.durationMinutes,
      daysRemaining: exam.daysRemaining,
      syllabusProgressPercent: exam.syllabusProgressPercent,
      targetScore: json.targetScore,
      priority: json.priority,
    };
  });

  // Next upcoming exam
  const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;

  // ─── Assemble Response Payload ──────────────────────────────────────────────
  const dashboardData = {
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar || null,
      studyStreak: req.user.studyStreak || 0,
      weeklyGoalHours,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      todayTasks: todayTasksList,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    studyTime: {
      todayMinutes,
      todayHours,
      weekMinutes,
      weekHours,
      totalHours,
      weeklyGoalHours,
      weeklyProgressPercent,
      weeklyBreakdown,
    },
    exams: {
      totalUpcoming: totalUpcomingExams,
      nextExam,
      upcoming: upcomingExams,
    },
    plans: {
      activeCount: activePlansCount,
    },
  };

  return successResponse(res, {
    statusCode: 200,
    message: 'Dashboard statistics retrieved successfully.',
    data: dashboardData,
  });
});

module.exports = {
  getDashboardSummary,
};
