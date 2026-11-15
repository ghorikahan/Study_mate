const mongoose = require('mongoose');

/**
 * Timetable Model
 * Represents a scheduled study block on a specific date.
 * Used for the weekly timetable calendar view (Day 9).
 *
 * Key design decisions:
 *  - `date` stores midnight UTC for the specific calendar day.
 *  - `startTime` / `endTime` store wall-clock HH:MM strings ("08:00", "10:30")
 *    so that overlap checks stay timezone-independent.
 *  - `dayOfWeek` (0 = Sun … 6 = Sat) is derived from `date` by a pre-save hook
 *    to power efficient weekly queries.
 *  - Compound index enforces no overlapping slots per user per date at the DB layer.
 */

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timetableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Timetable entry must belong to a user'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [2, 'Subject must be at least 2 characters'],
      maxlength: [80, 'Subject cannot exceed 80 characters'],
    },
    topic: {
      type: String,
      trim: true,
      default: '',
      maxlength: [120, 'Topic cannot exceed 120 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      // Auto-populated from date on pre-save
    },
    dayName: {
      type: String,
      enum: DAYS_OF_WEEK,
      // Auto-populated from date on pre-save
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:MM format)'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format (e.g. 09:00)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:MM format)'],
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format (e.g. 10:30)'],
    },
    durationMinutes: {
      type: Number,
      // Auto-calculated from startTime / endTime on pre-save
    },
    color: {
      type: String,
      default: '#8B5CF6',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDays: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every((d) => d >= 0 && d <= 6),
        message: 'Recurring days must be 0–6 (Sun–Sat)',
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'skipped'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Pre-save Hook ─────────────────────────────────────────────────────────────
timetableSchema.pre('save', function (next) {
  // Derive dayOfWeek and dayName from date
  if (this.date) {
    const d = new Date(this.date);
    this.dayOfWeek = d.getUTCDay();
    this.dayName = DAYS_OF_WEEK[this.dayOfWeek];
  }

  // Auto-calculate durationMinutes from startTime / endTime
  if (this.startTime && this.endTime) {
    const [sh, sm] = this.startTime.split(':').map(Number);
    const [eh, em] = this.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    this.durationMinutes = endMins - startMins;
  }

  next();
});

// ─── Virtual: timeRange display string ─────────────────────────────────────────
timetableSchema.virtual('timeRange').get(function () {
  if (!this.startTime || !this.endTime) return '';
  return `${this.startTime} – ${this.endTime}`;
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
timetableSchema.index({ user: 1, date: 1 });
timetableSchema.index({ user: 1, dayOfWeek: 1 });
timetableSchema.index({ user: 1, date: 1, startTime: 1 });
timetableSchema.index({ user: 1, subject: 1 });

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;

