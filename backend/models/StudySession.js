const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Study session must belong to a user'],
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    studyPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlan',
      default: null,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required for tracking study distribution'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Focused Study Session',
      maxlength: 120,
    },
    sessionType: {
      type: String,
      enum: {
        values: ['pomodoro', 'stopwatch', 'countdown', 'manual'],
        message: 'Session type must be pomodoro, stopwatch, countdown, or manual',
      },
      default: 'pomodoro',
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Study session must last at least 1 minute'],
      max: [720, 'Single study session cannot exceed 12 hours (720 minutes)'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    focusRating: {
      type: Number,
      min: [1, 'Focus rating minimum is 1'],
      max: [5, 'Focus rating maximum is 5'],
      default: 4,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save calculate endTime if missing
studySessionSchema.pre('save', function (next) {
  if (this.startTime && this.durationMinutes && !this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.durationMinutes * 60000);
  }
  next();
});

// Indexes for analytics aggregation
studySessionSchema.index({ user: 1, startTime: -1 });
studySessionSchema.index({ user: 1, subject: 1 });
studySessionSchema.index({ user: 1, sessionType: 1 });
studySessionSchema.index({ user: 1, isCompleted: 1 });

const StudySession = mongoose.models.StudySession || mongoose.model('StudySession', studySessionSchema);

module.exports = StudySession;
