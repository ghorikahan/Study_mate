const StudySession = require('../models/StudySession');
const User = require('../models/User');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Update user study streak when a valid session is logged
 */
const updateUserStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (!user.studyStreak) {
      user.studyStreak = { currentStreak: 1, longestStreak: 1, lastStudyDate: now };
      await user.save();
      return;
    }

    const lastDate = user.studyStreak.lastStudyDate ? new Date(user.studyStreak.lastStudyDate) : null;

    if (!lastDate) {
      user.studyStreak.currentStreak = 1;
      user.studyStreak.longestStreak = Math.max(user.studyStreak.longestStreak || 0, 1);
      user.studyStreak.lastStudyDate = now;
      await user.save();
      return;
    }

    const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((todayMidnight - lastMidnight) / oneDayMs);

    if (diffDays === 0) {
      // Already studied today — maintain streak, update timestamp
      user.studyStreak.lastStudyDate = now;
      await user.save();
    } else if (diffDays === 1) {
      // Studied yesterday — increment streak!
      user.studyStreak.currentStreak = (user.studyStreak.currentStreak || 0) + 1;
      user.studyStreak.longestStreak = Math.max(
        user.studyStreak.longestStreak || 0,
        user.studyStreak.currentStreak
      );
      user.studyStreak.lastStudyDate = now;
      await user.save();
    } else if (diffDays > 1) {
      // Streak broken — reset to 1
      user.studyStreak.currentStreak = 1;
      user.studyStreak.lastStudyDate = now;
      await user.save();
    }
  } catch (err) {
    console.error('updateUserStreak error:', err);
  }
};

// ─── CREATE STUDY SESSION ─────────────────────────────────────────────────────

exports.createStudySession = async (req, res) => {
  try {
    const {
      subject,
      durationMinutes,
      sessionType,
      startTime,
      endTime,
      title,
      notes,
      focusRating,
      task,
      studyPlan,
      clientSessionId,
      isCompleted,
    } = req.body;

    // Required validation
    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required for tracking study sessions',
      });
    }

    const parsedDuration = Number(durationMinutes);
    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 720) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a number between 1 and 720 minutes',
      });
    }

    // 1. Duplicate prevention by clientSessionId
    if (clientSessionId && clientSessionId.trim()) {
      const existing = await StudySession.findOne({
        user: req.user._id,
        clientSessionId: clientSessionId.trim(),
      }).lean();

      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Study session already recorded (idempotent)',
          data: { studySession: existing, isDuplicate: true },
        });
      }
    }

    // 2. Duplicate prevention by time proximity (same user, subject, duration within 60s)
    const sessionStart = startTime ? new Date(startTime) : new Date();
    const windowStart = new Date(sessionStart.getTime() - 60000);
    const windowEnd = new Date(sessionStart.getTime() + 60000);

    const fuzzyDuplicate = await StudySession.findOne({
      user: req.user._id,
      subject: subject.trim(),
      durationMinutes: parsedDuration,
      startTime: { $gte: windowStart, $lte: windowEnd },
    }).lean();

    if (fuzzyDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate study session detected (matching recent session)',
        data: { studySession: fuzzyDuplicate, isDuplicate: true },
      });
    }

    // Calculate end time
    const sessionEnd = endTime
      ? new Date(endTime)
      : new Date(sessionStart.getTime() + parsedDuration * 60000);

    const session = await StudySession.create({
      user: req.user._id,
      subject: subject.trim(),
      durationMinutes: parsedDuration,
      sessionType: sessionType || 'pomodoro',
      startTime: sessionStart,
      endTime: sessionEnd,
      title: title && title.trim() ? title.trim() : `${subject.trim()} Study Session`,
      notes: notes ? notes.trim() : '',
      focusRating: focusRating != null ? Number(focusRating) : 4,
      task: task || null,
      studyPlan: studyPlan || null,
      clientSessionId: clientSessionId ? clientSessionId.trim() : null,
      isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : true,
    });

    // Update streak asynchronously
    await updateUserStreak(req.user._id);

    return res.status(201).json({
      success: true,
      message: 'Study session recorded successfully',
      data: { studySession: session, isDuplicate: false },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('createStudySession error:', err);
    return res.status(500).json({ success: false, message: 'Server error while saving study session' });
  }
};

// ─── GET STUDY SESSIONS (with filters & summary) ──────────────────────────────

exports.getStudySessions = async (req, res) => {
  try {
    const { subject, sessionType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };

    if (subject && subject.trim()) {
      filter.subject = { $regex: subject.trim(), $options: 'i' };
    }

    if (sessionType && sessionType.trim()) {
      filter.sessionType = sessionType.trim();
    }

    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.startTime.$lte = e;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [sessions, total] = await Promise.all([
      StudySession.find(filter)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      StudySession.countDocuments(filter),
    ]);

    // Aggregate summary stats
    const [statsAgg, subjects] = await Promise.all([
      StudySession.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$durationMinutes' },
            totalSessions: { $sum: 1 },
            avgRating: { $avg: '$focusRating' },
          },
        },
      ]),
      StudySession.distinct('subject', { user: req.user._id }),
    ]);

    const summary = statsAgg.length > 0
      ? {
          totalMinutes: statsAgg[0].totalMinutes || 0,
          totalHours: Math.round(((statsAgg[0].totalMinutes || 0) / 60) * 10) / 10,
          totalSessions: statsAgg[0].totalSessions || 0,
          avgRating: Math.round((statsAgg[0].avgRating || 0) * 10) / 10,
        }
      : { totalMinutes: 0, totalHours: 0, totalSessions: 0, avgRating: 0 };

    return res.status(200).json({
      success: true,
      message: 'Study sessions retrieved successfully',
      data: {
        sessions,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        subjects: subjects.sort(),
        summary,
      },
    });
  } catch (err) {
    console.error('getStudySessions error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching study sessions' });
  }
};

// ─── GET STUDY SESSION STATS ──────────────────────────────────────────────────

exports.getStudySessionStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [todayAgg, allTimeAgg, user] = await Promise.all([
      StudySession.aggregate([
        {
          $match: {
            user: userId,
            startTime: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: null,
            todayMinutes: { $sum: '$durationMinutes' },
            todaySessions: { $sum: 1 },
            todayPomodoros: {
              $sum: { $cond: [{ $eq: ['$sessionType', 'pomodoro'] }, 1, 0] },
            },
          },
        },
      ]),
      StudySession.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$durationMinutes' },
            totalSessions: { $sum: 1 },
            totalPomodoros: {
              $sum: { $cond: [{ $eq: ['$sessionType', 'pomodoro'] }, 1, 0] },
            },
          },
        },
      ]),
      User.findById(userId).select('studyStreak').lean(),
    ]);

    const todayMinutes = todayAgg[0]?.todayMinutes || 0;
    const todaySessions = todayAgg[0]?.todaySessions || 0;
    const todayPomodoros = todayAgg[0]?.todayPomodoros || 0;
    const totalMinutes = allTimeAgg[0]?.totalMinutes || 0;
    const totalPomodoros = allTimeAgg[0]?.totalPomodoros || 0;

    return res.status(200).json({
      success: true,
      message: 'Focus stats retrieved',
      data: {
        todayMinutes,
        todayHours: Math.round((todayMinutes / 60) * 10) / 10,
        todaySessions,
        todayPomodoros,
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalPomodoros,
        currentStreak: user?.studyStreak?.currentStreak || 0,
        longestStreak: user?.studyStreak?.longestStreak || 0,
      },
    });
  } catch (err) {
    console.error('getStudySessionStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error while calculating stats' });
  }
};

// ─── GET SINGLE SESSION ───────────────────────────────────────────────────────

exports.getStudySessionById = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id).lean();

    if (!session) {
      return res.status(404).json({ success: false, message: 'Study session not found' });
    }
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this session' });
    }

    return res.status(200).json({
      success: true,
      message: 'Study session retrieved',
      data: { studySession: session },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE SESSION ───────────────────────────────────────────────────────────

exports.deleteStudySession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Study session not found' });
    }
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this session' });
    }

    await session.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Study session deleted successfully',
      data: {},
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error while deleting session' });
  }
};

