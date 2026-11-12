const { StudyPlan } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/responseHandler');

/**
 * POST /api/study-plans
 * Create a new study plan for the authenticated user
 */
const createStudyPlan = asyncHandler(async (req, res, next) => {
  const {
    subject,
    topic,
    title,
    date,
    startTime,
    duration,
    priority,
    description,
    color,
    status,
    targetCompletionDate,
    totalEstimatedHours,
    completedHours,
    milestones,
  } = req.body;

  // Basic validation
  if (!subject || !subject.trim()) {
    return next(new AppError('Subject is required', 400));
  }

  const planTopic = (topic || title || '').trim();
  if (!planTopic) {
    return next(new AppError('Topic/Title is required', 400));
  }
  if (planTopic.length < 2) {
    return next(new AppError('Topic must be at least 2 characters long', 400));
  }

  const scheduledDate = date ? new Date(date) : new Date();
  if (isNaN(scheduledDate.getTime())) {
    return next(new AppError('Invalid date provided', 400));
  }

  const parsedDuration = duration ? Number(duration) : 60;
  if (isNaN(parsedDuration) || parsedDuration < 5) {
    return next(new AppError('Duration must be at least 5 minutes', 400));
  }

  const studyPlan = await StudyPlan.create({
    user: req.user._id,
    subject: subject.trim(),
    topic: planTopic,
    title: planTopic,
    date: scheduledDate,
    startDate: scheduledDate,
    targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : scheduledDate,
    startTime: startTime ? startTime.trim() : '09:00 AM',
    duration: parsedDuration,
    priority: priority || 'medium',
    status: status || 'active',
    description: description ? description.trim() : '',
    color: color || '#8B5CF6',
    totalEstimatedHours: totalEstimatedHours || Math.round((parsedDuration / 60) * 10) / 10,
    completedHours: completedHours || 0,
    milestones: Array.isArray(milestones) ? milestones : [],
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Study plan created successfully',
    data: { studyPlan },
  });
});

/**
 * GET /api/study-plans
 * Get all study plans for the authenticated user with filtering and sorting
 */
const getStudyPlans = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    subject,
    priority,
    status,
    date,
    startDate,
    endDate,
    search,
    sort = 'date_asc',
  } = req.query;

  // Base query: strictly scoped to the logged-in user
  const query = { user: userId };

  // Filter by subject
  if (subject && subject.trim() && subject.trim().toLowerCase() !== 'all') {
    query.subject = new RegExp(`^${subject.trim()}$`, 'i');
  }

  // Filter by priority
  if (priority && priority.trim() && priority.trim().toLowerCase() !== 'all') {
    query.priority = priority.trim().toLowerCase();
  }

  // Filter by status
  if (status && status.trim() && status.trim().toLowerCase() !== 'all') {
    query.status = status.trim().toLowerCase();
  }

  // Filter by specific date (entire 24h window)
  if (date) {
    const targetDate = new Date(date);
    if (!isNaN(targetDate.getTime())) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
  }

  // Search in topic, title, description, or subject
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { topic: searchRegex },
      { title: searchRegex },
      { subject: searchRegex },
      { description: searchRegex },
    ];
  }

  // Sorting
  let sortOption = { date: 1, startTime: 1 };
  if (sort === 'date_desc') sortOption = { date: -1, startTime: -1 };
  if (sort === 'priority_desc') sortOption = { priority: -1, date: 1 };
  if (sort === 'created_desc') sortOption = { createdAt: -1 };

  // Fetch plans and user subjects list in parallel
  const [studyPlans, distinctSubjects] = await Promise.all([
    StudyPlan.find(query).sort(sortOption),
    StudyPlan.distinct('subject', { user: userId }),
  ]);

  return successResponse(res, {
    statusCode: 200,
    message: 'Study plans retrieved successfully',
    data: {
      studyPlans,
      total: studyPlans.length,
      subjects: distinctSubjects.filter(Boolean).sort(),
    },
  });
});

/**
 * GET /api/study-plans/:id
 * Get a single study plan by ID (ensuring ownership)
 */
const getStudyPlanById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const studyPlan = await StudyPlan.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!studyPlan) {
    return next(new AppError('Study plan not found or you do not have permission to view it', 404));
  }

  return successResponse(res, {
    statusCode: 200,
    message: 'Study plan retrieved successfully',
    data: { studyPlan },
  });
});

/**
 * PUT /api/study-plans/:id
 * Update a study plan (ensuring ownership)
 */
const updateStudyPlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const studyPlan = await StudyPlan.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!studyPlan) {
    return next(new AppError('Study plan not found or you do not have permission to modify it', 404));
  }

  const {
    subject,
    topic,
    title,
    date,
    startTime,
    duration,
    priority,
    status,
    description,
    color,
    totalEstimatedHours,
    completedHours,
    milestones,
  } = req.body;

  if (subject !== undefined) {
    if (!subject.trim()) return next(new AppError('Subject cannot be empty', 400));
    studyPlan.subject = subject.trim();
  }

  if (topic !== undefined || title !== undefined) {
    const updatedTopic = (topic !== undefined ? topic : title).trim();
    if (!updatedTopic || updatedTopic.length < 2) {
      return next(new AppError('Topic must be at least 2 characters long', 400));
    }
    studyPlan.topic = updatedTopic;
    studyPlan.title = updatedTopic;
  }

  if (date !== undefined) {
    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
      return next(new AppError('Invalid date provided', 400));
    }
    studyPlan.date = newDate;
    studyPlan.targetCompletionDate = newDate;
  }

  if (startTime !== undefined) {
    studyPlan.startTime = startTime.trim();
  }

  if (duration !== undefined) {
    const parsedDuration = Number(duration);
    if (isNaN(parsedDuration) || parsedDuration < 5) {
      return next(new AppError('Duration must be at least 5 minutes', 400));
    }
    studyPlan.duration = parsedDuration;
  }

  if (priority !== undefined) {
    studyPlan.priority = priority;
  }

  if (status !== undefined) {
    studyPlan.status = status;
  }

  if (description !== undefined) {
    studyPlan.description = description.trim();
  }

  if (color !== undefined) {
    studyPlan.color = color;
  }

  if (totalEstimatedHours !== undefined) {
    studyPlan.totalEstimatedHours = totalEstimatedHours;
  }

  if (completedHours !== undefined) {
    studyPlan.completedHours = completedHours;
  }

  if (milestones !== undefined && Array.isArray(milestones)) {
    studyPlan.milestones = milestones;
  }

  await studyPlan.save();

  return successResponse(res, {
    statusCode: 200,
    message: 'Study plan updated successfully',
    data: { studyPlan },
  });
});

/**
 * PATCH /api/study-plans/:id/status
 * Quick toggle or set status (e.g. active <-> completed)
 */
const toggleStudyPlanStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const studyPlan = await StudyPlan.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!studyPlan) {
    return next(new AppError('Study plan not found or you do not have permission to modify it', 404));
  }

  // If specific status passed, use it; otherwise toggle between active and completed
  if (status) {
    studyPlan.status = status;
  } else {
    studyPlan.status = studyPlan.status === 'completed' ? 'active' : 'completed';
  }

  await studyPlan.save();

  return successResponse(res, {
    statusCode: 200,
    message: `Study plan marked as ${studyPlan.status}`,
    data: { studyPlan },
  });
});

/**
 * DELETE /api/study-plans/:id
 * Delete a study plan (ensuring ownership)
 */
const deleteStudyPlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const studyPlan = await StudyPlan.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (!studyPlan) {
    return next(new AppError('Study plan not found or you do not have permission to delete it', 404));
  }

  return successResponse(res, {
    statusCode: 200,
    message: 'Study plan deleted successfully',
    data: null,
  });
});

module.exports = {
  createStudyPlan,
  getStudyPlans,
  getStudyPlanById,
  updateStudyPlan,
  toggleStudyPlanStatus,
  deleteStudyPlan,
};

