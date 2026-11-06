const mongoose = require('mongoose');

const syllabusTopicSchema = new mongoose.Schema(
  {
    topicName: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
      maxlength: 120,
    },
    isCovered: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Exam must belong to a user'],
      index: true,
    },
    examTitle: {
      type: String,
      required: [true, 'Please provide an exam title (e.g. Midterm, Final)'],
      trim: true,
      minlength: [2, 'Exam title must be at least 2 characters long'],
      maxlength: [120, 'Exam title cannot exceed 120 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    startTime: {
      type: String,
      default: '09:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format'],
    },
    durationMinutes: {
      type: Number,
      default: 180,
      min: [15, 'Exam duration must be at least 15 minutes'],
      max: [720, 'Exam duration cannot exceed 12 hours'],
    },
    location: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    seatNumber: {
      type: String,
      trim: true,
      default: '',
    },
    targetScore: {
      type: Number,
      min: [0, 'Target score cannot be negative'],
      max: [100, 'Target score cannot exceed 100'],
      default: null,
    },
    actualScore: {
      type: Number,
      min: [0, 'Actual score cannot be negative'],
      max: [100, 'Actual score cannot exceed 100'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'in-progress', 'completed', 'cancelled'],
        message: 'Status must be upcoming, in-progress, completed, or cancelled',
      },
      default: 'upcoming',
    },
    syllabusTopics: [syllabusTopicSchema],
    reminderSent: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for remaining countdown days
examSchema.virtual('daysRemaining').get(function () {
  if (!this.examDate) return null;
  const now = new Date();
  const diffTime = new Date(this.examDate).getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for syllabus completion percentage
examSchema.virtual('syllabusProgressPercent').get(function () {
  if (!this.syllabusTopics || this.syllabusTopics.length === 0) return 0;
  const covered = this.syllabusTopics.filter((t) => t.isCovered).length;
  return Math.round((covered / this.syllabusTopics.length) * 100);
});

// Compound indexes
examSchema.index({ user: 1, examDate: 1 });
examSchema.index({ user: 1, status: 1 });
examSchema.index({ user: 1, subject: 1 });

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

module.exports = Exam;
