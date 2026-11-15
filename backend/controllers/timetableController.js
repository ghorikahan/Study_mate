const { Timetable } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/responseHandler');

// ─── Helper: parse HH:MM → total minutes ───────────────────────────────────────
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// ─── Helper: format midnight UTC for a date string ─────────────────────────────
const toMidnightUTC = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Check for overlapping timetable entries for a user on a date,
 * excluding an optional entryId (used for updates).
 */
const checkOverlap = async (userId, date, startTime, endTime, excludeId = null) => {
  const dayStart = toMidnightUTC(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  const query = {
    user: userId,
    date: { $gte: dayStart, $lt: dayEnd },
  };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Timetable.find(query).lean();

  for (const entry of existing) {
    const exStart = toMinutes(entry.startTime);
    const exEnd = toMinutes(entry.endTime);
    // Overlap condition: intervals intersect (not just touch)
    if (newStart < exEnd && newEnd > exStart) {
      return entry; // Return the conflicting entry
    }
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE  POST /api/timetable
// ─────────────────────────────────────────────────────────────────────────────
const createEntry = asyncHandler(async (req, res) => {
  const { subject, topic, date, startTime, endTime, color, notes, isRecurring, recurringDays } = req.body;

  // Validate required fields
  if (!subject || !subject.trim()) throw new AppError('Subject is required', 400);
  if (!date) throw new AppError('Date is required', 400);
  if (!startTime) throw new AppError('Start time is required', 400);
  if (!endTime) throw new AppError('End time is required', 400);

  // Validate HH:MM format
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(startTime)) throw new AppError('Start time must be in HH:MM format (e.g. 09:00)', 400);
  if (!timeRegex.test(endTime)) throw new AppError('End time must be in HH:MM format (e.g. 10:30)', 400);

  // Validate time logic
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    throw new AppError('End time must be after start time', 400);
  }

  // Minimum 15-minute session
  if (toMinutes(endTime) - toMinutes(startTime) < 15) {
    throw new AppError('Study session must be at least 15 minutes long', 400);
  }

  // Overlap check
  const conflict = await checkOverlap(req.user._id, date, startTime, endTime);
  if (conflict) {
    throw new AppError(
      `Time slot conflicts with existing entry "${conflict.subject}" (${conflict.startTime}–${conflict.endTime})`,
      409
    );
  }

  const entry = await Timetable.create({
    user: req.user._id,
    subject: subject.trim(),
    topic: topic?.trim() || '',
    date: toMidnightUTC(date),
    startTime,
    endTime,
    color: color || '#8B5CF6',
    notes: notes?.trim() || '',
    isRecurring: isRecurring || false,
    recurringDays: recurringDays || [],
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Timetable entry created successfully.',
    data: { entry },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET WEEKLY  GET /api/timetable?weekStart=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
const getWeekEntries = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Default to current Monday if no weekStart provided
  let weekStart;
  if (req.query.weekStart) {
    weekStart = toMidnightUTC(req.query.weekStart);
  } else {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // go to Monday
    weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diff);
    weekStart.setUTCHours(0, 0, 0, 0);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7); // exclusive

  const entries = await Timetable.find({
    user: userId,
    date: { $gte: weekStart, $lt: weekEnd },
  })
    .sort({ date: 1, startTime: 1 })
    .lean();

  // Group entries by ISO date string (YYYY-MM-DD)
  const grouped = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    grouped[d.toISOString().split('T')[0]] = [];
  }
  for (const entry of entries) {
    const key = new Date(entry.date).toISOString().split('T')[0];
    if (grouped[key]) grouped[key].push(entry);
  }

  // Build per-day stats
  const days = Object.entries(grouped).map(([date, dayEntries]) => ({
    date,
    dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      new Date(date + 'T00:00:00Z').getUTCDay()
    ],
    totalMinutes: dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0),
    entryCount: dayEntries.length,
    entries: dayEntries,
  }));

  const totalWeekMinutes = days.reduce((s, d) => s + d.totalMinutes, 0);
  const subjects = [...new Set(entries.map((e) => e.subject))].sort();

  return successResponse(res, {
    statusCode: 200,
    message: 'Weekly timetable retrieved successfully.',
    data: {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: new Date(weekEnd.getTime() - 86400000).toISOString().split('T')[0],
      totalWeekMinutes,
      totalWeekHours: Number((totalWeekMinutes / 60).toFixed(1)),
      subjects,
      days,
      total: entries.length,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET BY DATE  GET /api/timetable/day?date=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
const getDayEntries = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new AppError('Date query parameter is required', 400);

  const dayStart = toMidnightUTC(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const entries = await Timetable.find({
    user: req.user._id,
    date: { $gte: dayStart, $lt: dayEnd },
  })
    .sort({ startTime: 1 })
    .lean();

  const totalMinutes = entries.reduce((s, e) => s + (e.durationMinutes || 0), 0);

  return successResponse(res, {
    statusCode: 200,
    message: 'Daily timetable retrieved successfully.',
    data: {
      date,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        new Date(date + 'T00:00:00Z').getUTCDay()
      ],
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      entries,
      total: entries.length,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET ONE  GET /api/timetable/:id
// ─────────────────────────────────────────────────────────────────────────────
const getEntryById = asyncHandler(async (req, res) => {
  const entry = await Timetable.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) throw new AppError('Timetable entry not found', 404);

  return successResponse(res, {
    statusCode: 200,
    message: 'Timetable entry retrieved successfully.',
    data: { entry },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  PUT /api/timetable/:id
// ─────────────────────────────────────────────────────────────────────────────
const updateEntry = asyncHandler(async (req, res) => {
  const entry = await Timetable.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) throw new AppError('Timetable entry not found', 404);

  const { subject, topic, date, startTime, endTime, color, notes, isRecurring, recurringDays, status } = req.body;

  const newDate = date || entry.date;
  const newStart = startTime || entry.startTime;
  const newEnd = endTime || entry.endTime;

  // Time validation
  const timeRegex = /^\d{2}:\d{2}$/;
  if (startTime && !timeRegex.test(startTime)) throw new AppError('Start time must be in HH:MM format', 400);
  if (endTime && !timeRegex.test(endTime)) throw new AppError('End time must be in HH:MM format', 400);

  if (toMinutes(newStart) >= toMinutes(newEnd)) {
    throw new AppError('End time must be after start time', 400);
  }
  if (toMinutes(newEnd) - toMinutes(newStart) < 15) {
    throw new AppError('Study session must be at least 15 minutes long', 400);
  }

  // Overlap check (exclude self)
  const conflict = await checkOverlap(req.user._id, newDate, newStart, newEnd, entry._id);
  if (conflict) {
    throw new AppError(
      `Time slot conflicts with existing entry "${conflict.subject}" (${conflict.startTime}–${conflict.endTime})`,
      409
    );
  }

  // Apply updates
  if (subject !== undefined) entry.subject = subject.trim();
  if (topic !== undefined) entry.topic = topic.trim();
  if (date !== undefined) entry.date = toMidnightUTC(date);
  if (startTime !== undefined) entry.startTime = startTime;
  if (endTime !== undefined) entry.endTime = endTime;
  if (color !== undefined) entry.color = color;
  if (notes !== undefined) entry.notes = notes.trim();
  if (isRecurring !== undefined) entry.isRecurring = isRecurring;
  if (recurringDays !== undefined) entry.recurringDays = recurringDays;
  if (status !== undefined) {
    const validStatuses = ['scheduled', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) throw new AppError('Invalid status value', 400);
    entry.status = status;
  }

  await entry.save();

  return successResponse(res, {
    statusCode: 200,
    message: 'Timetable entry updated successfully.',
    data: { entry },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE  DELETE /api/timetable/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await Timetable.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!entry) throw new AppError('Timetable entry not found', 404);

  return successResponse(res, {
    statusCode: 200,
    message: 'Timetable entry deleted successfully.',
    data: null,
  });
});

module.exports = {
  createEntry,
  getWeekEntries,
  getDayEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
};

