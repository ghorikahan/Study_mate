const { StudySession, Task, User, Exam } = require('../models');

// Subject palette for charts & distribution
const PALETTE = [
  '#8B5CF6', // Purple
  '#22D3EE', // Cyan
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#3B82F6', // Blue
  '#84CC16', // Lime
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── GET /api/analytics/overview ──────────────────────────────────────────────

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '7d' } = req.query;

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let daysCount = 7;
    if (timeRange === '30d' || timeRange === 'month') {
      daysCount = 30;
    } else if (timeRange === 'all') {
      daysCount = 90; // 90 days for trends
    }

    const startDate = new Date(endOfToday);
    startDate.setDate(endOfToday.getDate() - (daysCount - 1));
    startDate.setHours(0, 0, 0, 0);

    // 1. Fetch user preferences & streak
    const user = await User.findById(userId).select('preferences studyStreak').lean();
    const weeklyGoalHours = user?.preferences?.weeklyStudyGoalHours || 20;
    const monthlyGoalHours = weeklyGoalHours * 4;

    // 2. Aggregate study sessions in time range
    const [
      sessionsInPeriod,
      subjectAgg,
      totalFocusAgg,
      taskCountsAgg,
      dailyTaskAgg,
      monthStudyAgg,
      examsAgg,
    ] = await Promise.all([
      // Daily study breakdown in range
      StudySession.aggregate([
        {
          $match: {
            user: userId,
            startTime: { $gte: startDate, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            minutes: { $sum: '$durationMinutes' },
            sessionsCount: { $sum: 1 },
          },
        },
      ]),

      // Subject-wise distribution in range
      StudySession.aggregate([
        {
          $match: {
            user: userId,
            startTime: { $gte: startDate, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: '$subject',
            minutes: { $sum: '$durationMinutes' },
            sessionsCount: { $sum: 1 },
            avgRating: { $avg: '$focusRating' },
          },
        },
        { $sort: { minutes: -1 } },
      ]),

      // All focus sessions stats in period
      StudySession.aggregate([
        {
          $match: {
            user: userId,
            startTime: { $gte: startDate, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$durationMinutes' },
            totalSessions: { $sum: 1 },
            pomodoros: {
              $sum: { $cond: [{ $eq: ['$sessionType', 'pomodoro'] }, 1, 0] },
            },
            shortBreaks: {
              $sum: { $cond: [{ $eq: ['$sessionType', 'shortBreak'] }, 1, 0] },
            },
            longBreaks: {
              $sum: { $cond: [{ $eq: ['$sessionType', 'longBreak'] }, 1, 0] },
            },
            avgRating: { $avg: '$focusRating' },
          },
        },
      ]),

      // Task status breakdown
      Task.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'pending'] },
                      { $lt: ['$dueDate', now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Daily tasks completed in range
      Task.aggregate([
        {
          $match: {
            user: userId,
            status: 'completed',
            completedAt: { $gte: startDate, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            completedCount: { $sum: 1 },
          },
        },
      ]),

      // Monthly total study minutes (last 30 days)
      StudySession.aggregate([
        {
          $match: {
            user: userId,
            startTime: {
              $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              $lte: endOfToday,
            },
          },
        },
        { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
      ]),

      // Exams summary
      Exam.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            upcoming: { $sum: { $cond: [{ $gte: ['$examDate', now] }, 1, 0] } },
          },
        },
      ]),
    ]);

    // ─── Build continuous daily study breakdown ──────────────────────────────
    const sessionDateMap = new Map();
    sessionsInPeriod.forEach((s) => sessionDateMap.set(s._id, s));

    const taskDateMap = new Map();
    dailyTaskAgg.forEach((t) => taskDateMap.set(t._id, t.completedCount));

    const dailyBreakdown = [];
    let periodTotalMinutes = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(endOfToday);
      d.setDate(endOfToday.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = DAY_NAMES[d.getDay()];
      const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;

      const sessionData = sessionDateMap.get(dateStr);
      const minutes = sessionData ? sessionData.minutes : 0;
      const sessions = sessionData ? sessionData.sessionsCount : 0;
      const tasksCompleted = taskDateMap.get(dateStr) || 0;

      periodTotalMinutes += minutes;

      dailyBreakdown.push({
        date: dateStr,
        dayName,
        shortDate,
        minutes,
        hours: Math.round((minutes / 60) * 10) / 10,
        sessions,
        tasksCompleted,
      });
    }

    const periodTotalHours = Math.round((periodTotalMinutes / 60) * 10) / 10;

    // ─── Build subject distribution with percentages & colors ─────────────────
    let assignedColorIdx = 0;
    const subjectDistribution = subjectAgg.map((s) => {
      const mins = s.minutes || 0;
      const pct = periodTotalMinutes > 0 ? Math.round((mins / periodTotalMinutes) * 100) : 0;
      const color = PALETTE[assignedColorIdx % PALETTE.length];
      assignedColorIdx++;

      return {
        subject: s._id || 'General',
        minutes: mins,
        hours: Math.round((mins / 60) * 10) / 10,
        percentage: pct,
        sessionsCount: s.sessionsCount || 0,
        avgRating: Math.round((s.avgRating || 4) * 10) / 10,
        color,
      };
    });

    // ─── Task metrics ────────────────────────────────────────────────────────
    const taskTotal = taskCountsAgg[0]?.total || 0;
    const taskCompleted = taskCountsAgg[0]?.completed || 0;
    const taskPending = taskCountsAgg[0]?.pending || 0;
    const taskOverdue = taskCountsAgg[0]?.overdue || 0;
    const taskCompletionRate = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;

    // ─── Focus session metrics ────────────────────────────────────────────────
    const totalSessions = totalFocusAgg[0]?.totalSessions || 0;
    const pomodorosCompleted = totalFocusAgg[0]?.pomodoros || 0;
    const avgFocusRating = totalFocusAgg[0]?.avgRating
      ? Math.round(totalFocusAgg[0].avgRating * 10) / 10
      : 4.0;

    // ─── Monthly progress metrics ────────────────────────────────────────────
    const monthMinutes = monthStudyAgg[0]?.totalMinutes || 0;
    const monthHours = Math.round((monthMinutes / 60) * 10) / 10;
    const monthlyProgressPercent = monthlyGoalHours > 0
      ? Math.min(100, Math.round((monthHours / monthlyGoalHours) * 100))
      : 0;

    // ─── Productivity Score Calculation (0-100) ──────────────────────────────
    // 40% study goal progress + 40% task completion + 20% focus rating
    const goalRatio = Math.min(1, periodTotalHours / (weeklyGoalHours * (daysCount / 7)));
    const goalScore = goalRatio * 40;
    const taskScore = (taskCompletionRate / 100) * 40;
    const ratingScore = (avgFocusRating / 5) * 20;
    const productivityScore = Math.min(100, Math.round(goalScore + taskScore + ratingScore));

    return res.status(200).json({
      success: true,
      message: 'Analytics overview retrieved successfully',
      data: {
        timeRange,
        daysCount,
        studyTime: {
          totalMinutes: periodTotalMinutes,
          totalHours: periodTotalHours,
          dailyAverageHours: Math.round((periodTotalHours / daysCount) * 10) / 10,
          weeklyGoalHours,
          goalProgressPercent: weeklyGoalHours > 0
            ? Math.min(100, Math.round((periodTotalHours / weeklyGoalHours) * 100))
            : 0,
          dailyBreakdown,
        },
        taskMetrics: {
          total: taskTotal,
          completed: taskCompleted,
          pending: taskPending,
          overdue: taskOverdue,
          completionRate: taskCompletionRate,
        },
        subjectDistribution,
        focusMetrics: {
          totalSessions,
          pomodorosCompleted,
          avgFocusRating,
          totalFocusHours: periodTotalHours,
        },
        streak: {
          currentStreak: user?.studyStreak?.currentStreak || 0,
          longestStreak: user?.studyStreak?.longestStreak || 0,
          lastStudyDate: user?.studyStreak?.lastStudyDate || null,
        },
        monthlyProgress: {
          monthMinutes,
          monthHours,
          monthlyGoalHours,
          monthlyProgressPercent,
        },
        productivityScore: Math.max(10, productivityScore),
        examsCount: {
          total: examsAgg[0]?.total || 0,
          upcoming: examsAgg[0]?.upcoming || 0,
        },
      },
    });
  } catch (err) {
    console.error('getAnalyticsOverview error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while calculating analytics',
    });
  }
};

