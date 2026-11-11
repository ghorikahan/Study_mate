const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      maxlength: 120,
    },
    targetDate: {
      type: Date,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const studyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Study plan must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the study plan'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    startTime: {
      type: String,
      trim: true,
      default: '09:00 AM',
    },
    duration: {
      type: Number,
      default: 60,
      min: [5, 'Duration must be at least 5 minutes'],
    },
    color: {
      type: String,
      default: '#8B5CF6',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'paused', 'archived'],
        message: 'Status must be active, completed, paused, or archived',
      },
      default: 'active',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be low, medium, high, or urgent',
      },
      default: 'medium',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetCompletionDate: {
      type: Date,
      default: function () {
        return this.date || new Date();
      },
    },
    totalEstimatedHours: {
      type: Number,
      default: 0,
      min: [0, 'Estimated hours cannot be negative'],
    },
    completedHours: {
      type: Number,
      default: 0,
      min: [0, 'Completed hours cannot be negative'],
    },
    milestones: [milestoneSchema],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook to keep title and topic in sync
studyPlanSchema.pre('validate', function (next) {
  if (!this.title && this.topic) {
    this.title = this.topic;
  } else if (!this.topic && this.title) {
    this.topic = this.title;
  }
  if (!this.targetCompletionDate && this.date) {
    this.targetCompletionDate = this.date;
  }
  next();
});

// Virtual for completion percentage
studyPlanSchema.virtual('progressPercent').get(function () {
  if (!this.totalEstimatedHours || this.totalEstimatedHours <= 0) {
    if (this.milestones && this.milestones.length > 0) {
      const completed = this.milestones.filter((m) => m.isCompleted).length;
      return Math.round((completed / this.milestones.length) * 100);
    }
    return this.status === 'completed' ? 100 : 0;
  }
  const pct = Math.round((this.completedHours / this.totalEstimatedHours) * 100);
  return Math.min(pct, 100);
});

// Indexes for fast querying per user
studyPlanSchema.index({ user: 1, status: 1 });
studyPlanSchema.index({ user: 1, subject: 1 });
studyPlanSchema.index({ user: 1, targetCompletionDate: 1 });

const StudyPlan = mongoose.models.StudyPlan || mongoose.model('StudyPlan', studyPlanSchema);

module.exports = StudyPlan;

