const Exam = require('../models/Exam');
const { escapeRegex } = require('../utils');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sanitiseTopics = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && typeof t.topicName === 'string' && t.topicName.trim())
    .map((t) => ({
      topicName: t.topicName.trim(),
      isCovered: Boolean(t.isCovered),
    }));
};

const buildFilter = (userId, { status, subject, priority, search }) => {
  const filter = { user: userId };
  const andClauses = [];

  if (status === 'upcoming') {
    filter.examDate = { $gte: new Date() };
    filter.status = { $in: ['upcoming', 'in-progress'] };
  } else if (status === 'past') {
    andClauses.push({
      $or: [
        { examDate: { $lt: new Date() } },
        { status: { $in: ['completed', 'cancelled'] } },
      ],
    });
  } else if (status === 'this-week') {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    filter.examDate = { $gte: now, $lte: weekEnd };
  }

  if (priority && priority.trim() && priority.trim().toLowerCase() !== 'all') {
    filter.priority = priority.trim().toLowerCase();
  }

  if (subject && subject.trim() && subject.trim().toLowerCase() !== 'all') {
    filter.subject = { $regex: `^${escapeRegex(subject.trim())}$`, $options: 'i' };
  }

  if (search && search.trim()) {
    const safeRegex = escapeRegex(search.trim());
    andClauses.push({
      $or: [
        { examTitle: { $regex: safeRegex, $options: 'i' } },
        { subject: { $regex: safeRegex, $options: 'i' } },
        { notes: { $regex: safeRegex, $options: 'i' } },
      ],
    });
  }

  if (andClauses.length === 1) {
    Object.assign(filter, andClauses[0]);
  } else if (andClauses.length > 1) {
    filter.$and = andClauses;
  }

  return filter;
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

exports.createExam = async (req, res) => {
  try {
    const {
      examTitle,
      subject,
      examDate,
      startTime,
      durationMinutes,
      location,
      seatNumber,
      targetScore,
      priority,
      syllabusTopics,
      notes,
    } = req.body;

    // Required field validation
    if (!examTitle || !examTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Exam title is required',
      });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required',
      });
    }
    if (!examDate) {
      return res.status(400).json({
        success: false,
        message: 'Exam date is required',
      });
    }

    const parsedDate = new Date(examDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam date format',
      });
    }

    const exam = await Exam.create({
      user: req.user._id,
      examTitle: examTitle.trim(),
      subject: subject.trim(),
      examDate: parsedDate,
      ...(startTime !== undefined && { startTime }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(location !== undefined && { location }),
      ...(seatNumber !== undefined && { seatNumber }),
      ...(targetScore !== undefined && { targetScore }),
      ...(priority !== undefined && { priority }),
      syllabusTopics: sanitiseTopics(syllabusTopics),
      ...(notes !== undefined && { notes }),
    });

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('createExam error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating exam' });
  }
};

// ─── GET ALL (with filters) ───────────────────────────────────────────────────

exports.getExams = async (req, res) => {
  try {
    const { status, subject, priority, search, page, limit } = req.query;
    const filter = buildFilter(req.user._id, { status, subject, priority, search });

    // Sort: upcoming → ASC by date; past → DESC by date; default → ASC
    const sortOrder = status === 'past' ? -1 : 1;

    // Pagination support
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.max(1, parseInt(limit, 10)) : 0;

    let examsQuery = Exam.find(filter).sort({ examDate: sortOrder });
    if (limitNum > 0) {
      examsQuery = examsQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const exams = await examsQuery.lean({ virtuals: true });

    // Counts for UI badges
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const [totalCount, upcomingCount, thisWeekCount, filteredTotal] = await Promise.all([
      Exam.countDocuments({ user: req.user._id }),
      Exam.countDocuments({
        user: req.user._id,
        examDate: { $gte: now },
        status: { $in: ['upcoming', 'in-progress'] },
      }),
      Exam.countDocuments({
        user: req.user._id,
        examDate: { $gte: now, $lte: weekEnd },
      }),
      Exam.countDocuments(filter),
    ]);

    // Distinct subjects
    const subjects = await Exam.distinct('subject', { user: req.user._id });

    return res.status(200).json({
      success: true,
      message: 'Exams fetched successfully',
      data: {
        exams,
        total: filteredTotal,
        subjects: subjects.filter(Boolean).sort(),
        counts: {
          total: totalCount,
          upcoming: upcomingCount,
          thisWeek: thisWeekCount,
          past: Math.max(0, totalCount - upcomingCount),
        },
        page: pageNum,
        limit: limitNum > 0 ? limitNum : filteredTotal,
      },
    });
  } catch (err) {
    console.error('getExams error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching exams' });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────

exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).lean({ virtuals: true });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    if (exam.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this exam' });
    }

    return res.status(200).json({ success: true, message: 'Exam fetched', data: { exam } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }
    console.error('getExamById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    if (exam.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this exam' });
    }

    const allowedFields = [
      'examTitle', 'subject', 'examDate', 'startTime', 'durationMinutes',
      'location', 'seatNumber', 'targetScore', 'actualScore', 'priority',
      'status', 'notes', 'syllabusTopics',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'syllabusTopics') {
          exam.syllabusTopics = sanitiseTopics(req.body[field]);
        } else if (field === 'examDate') {
          const d = new Date(req.body[field]);
          if (!isNaN(d.getTime())) exam.examDate = d;
        } else {
          exam[field] = req.body[field];
        }
      }
    });

    await exam.save();

    const updated = await Exam.findById(exam._id).lean({ virtuals: true });

    return res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam: updated },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }
    console.error('updateExam error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating exam' });
  }
};

// ─── TOGGLE SYLLABUS TOPIC ────────────────────────────────────────────────────

exports.toggleSyllabusTopic = async (req, res) => {
  try {
    const { id: examId, topicId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    if (exam.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const topic = exam.syllabusTopics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Syllabus topic not found' });
    }

    topic.isCovered = !topic.isCovered;
    await exam.save();

    const updated = await Exam.findById(examId).lean({ virtuals: true });

    return res.status(200).json({
      success: true,
      message: `Topic marked as ${topic.isCovered ? 'covered' : 'uncovered'}`,
      data: { exam: updated },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }
    console.error('toggleSyllabusTopic error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    if (exam.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this exam' });
    }

    await exam.deleteOne();

    return res.status(200).json({ success: true, message: 'Exam deleted successfully', data: {} });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }
    console.error('deleteExam error:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting exam' });
  }
};

