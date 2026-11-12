const { Task } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/responseHandler');

/**
 * POST /api/tasks
 * Create a new task for the authenticated user
 */
const createTask = asyncHandler(async (req, res, next) => {
  const {
    title,
    subject,
    description,
    dueDate,
    priority,
    status,
    estimatedMinutes,
    studyPlan,
    tags,
  } = req.body;

  // Field validation
  if (!title || !title.trim()) {
    return next(new AppError('Task title is required', 400));
  }
  if (title.trim().length < 2) {
    return next(new AppError('Task title must be at least 2 characters long', 400));
  }

  if (!subject || !subject.trim()) {
    return next(new AppError('Subject is required for task categorisation', 400));
  }

  if (!dueDate) {
    return next(new AppError('Due date is required', 400));
  }
  const parsedDueDate = new Date(dueDate);
  if (isNaN(parsedDueDate.getTime())) {
    return next(new AppError('Invalid due date provided', 400));
  }

  const parsedDuration = estimatedMinutes ? Number(estimatedMinutes) : 30;
  if (isNaN(parsedDuration) || parsedDuration < 5) {
    return next(new AppError('Estimated duration must be at least 5 minutes', 400));
  }

  const task = await Task.create({
    user: req.user._id,
    title: title.trim(),
    subject: subject.trim(),
    description: description ? description.trim() : '',
    dueDate: parsedDueDate,
    priority: priority || 'medium',
    status: status || 'pending',
    estimatedMinutes: parsedDuration,
    studyPlan: studyPlan || null,
    tags: Array.isArray(tags) ? tags : [],
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Task created successfully',
    data: { task },
  });
});

/**
 * GET /api/tasks
 * Get all tasks for the authenticated user with filtering, counts, and search
 */
const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    status,
    priority,
    subject,
    search,
    sort = 'dueDate_asc',
  } = req.query;

  const now = new Date();

  // Base query: strictly scoped to the logged-in user
  const query = { user: userId };

  // Status & Overdue Filtering
  if (status && status.trim() && status.trim().toLowerCase() !== 'all') {
    const s = status.trim().toLowerCase();
    if (s === 'overdue') {
      // Overdue: dueDate is in the past AND status is not completed/cancelled
      query.dueDate = { $lt: now };
      query.status = { $nin: ['completed', 'cancelled'] };
    } else if (s === 'pending') {
      query.status = { $in: ['pending', 'in-progress'] };
    } else if (s === 'completed') {
      query.status = 'completed';
    } else {
      query.status = s;
    }
  }

  // Priority Filtering
  if (priority && priority.trim() && priority.trim().toLowerCase() !== 'all') {
    query.priority = priority.trim().toLowerCase();
  }

  // Subject Filtering
  if (subject && subject.trim() && subject.trim().toLowerCase() !== 'all') {
    query.subject = new RegExp(`^${subject.trim()}$`, 'i');
  }

  // Search Filter (matches title, subject, description)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { subject: searchRegex },
      { description: searchRegex },
    ];
  }

  // Sorting
  let sortOption = { dueDate: 1, priority: -1 };
  if (sort === 'dueDate_desc') sortOption = { dueDate: -1 };
  if (sort === 'priority_desc') sortOption = { priority: -1, dueDate: 1 };
  if (sort === 'created_desc') sortOption = { createdAt: -1 };

  // Execute task fetch and count queries in parallel
  const [tasks, totalCount, pendingCount, completedCount, overdueCount, distinctSubjects] =
    await Promise.all([
      Task.find(query).sort(sortOption),
      // All user tasks
      Task.countDocuments({ user: userId }),
      // Pending or in-progress tasks
      Task.countDocuments({ user: userId, status: { $in: ['pending', 'in-progress'] } }),
      // Completed tasks
      Task.countDocuments({ user: userId, status: 'completed' }),
      // Overdue tasks
      Task.countDocuments({
        user: userId,
        dueDate: { $lt: now },
        status: { $nin: ['completed', 'cancelled'] },
      }),
      // Distinct subjects for user
      Task.distinct('subject', { user: userId }),
    ]);

  return successResponse(res, {
    statusCode: 200,
    message: 'Tasks retrieved successfully',
    data: {
      tasks,
      total: tasks.length,
      counts: {
        total: totalCount,
        pending: pendingCount,
        completed: completedCount,
        overdue: overdueCount,
      },
      subjects: distinctSubjects.filter(Boolean).sort(),
    },
  });
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID (ensuring ownership)
 */
const getTaskById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const task = await Task.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!task) {
    return next(new AppError('Task not found or you do not have permission to view it', 404));
  }

  return successResponse(res, {
    statusCode: 200,
    message: 'Task retrieved successfully',
    data: { task },
  });
});

/**
 * PUT /api/tasks/:id
 * Update a task (ensuring ownership)
 */
const updateTask = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const task = await Task.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!task) {
    return next(new AppError('Task not found or you do not have permission to modify it', 404));
  }

  const {
    title,
    subject,
    description,
    dueDate,
    priority,
    status,
    estimatedMinutes,
    actualMinutes,
    studyPlan,
    tags,
  } = req.body;

  if (title !== undefined) {
    if (!title.trim() || title.trim().length < 2) {
      return next(new AppError('Task title must be at least 2 characters long', 400));
    }
    task.title = title.trim();
  }

  if (subject !== undefined) {
    if (!subject.trim()) {
      return next(new AppError('Subject cannot be empty', 400));
    }
    task.subject = subject.trim();
  }

  if (description !== undefined) {
    task.description = description.trim();
  }

  if (dueDate !== undefined) {
    const newDueDate = new Date(dueDate);
    if (isNaN(newDueDate.getTime())) {
      return next(new AppError('Invalid due date provided', 400));
    }
    task.dueDate = newDueDate;
  }

  if (priority !== undefined) {
    task.priority = priority;
  }

  if (status !== undefined) {
    task.status = status;
  }

  if (estimatedMinutes !== undefined) {
    const parsedDuration = Number(estimatedMinutes);
    if (isNaN(parsedDuration) || parsedDuration < 5) {
      return next(new AppError('Estimated duration must be at least 5 minutes', 400));
    }
    task.estimatedMinutes = parsedDuration;
  }

  if (actualMinutes !== undefined) {
    task.actualMinutes = Number(actualMinutes) || 0;
  }

  if (studyPlan !== undefined) {
    task.studyPlan = studyPlan || null;
  }

  if (tags !== undefined && Array.isArray(tags)) {
    task.tags = tags;
  }

  await task.save();

  return successResponse(res, {
    statusCode: 200,
    message: 'Task updated successfully',
    data: { task },
  });
});

/**
 * PATCH /api/tasks/:id/toggle
 * Quick toggle task status between completed and pending
 */
const toggleTaskStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await Task.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!task) {
    return next(new AppError('Task not found or you do not have permission to modify it', 404));
  }

  if (status) {
    task.status = status;
  } else {
    task.status = task.status === 'completed' ? 'pending' : 'completed';
  }

  await task.save();

  return successResponse(res, {
    statusCode: 200,
    message: `Task marked as ${task.status}`,
    data: { task },
  });
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (ensuring ownership)
 */
const deleteTask = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const task = await Task.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (!task) {
    return next(new AppError('Task not found or you do not have permission to delete it', 404));
  }

  return successResponse(res, {
    statusCode: 200,
    message: 'Task deleted successfully',
    data: null,
  });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  toggleTaskStatus,
  deleteTask,
};

