const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
      index: true,
    },
    studyPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlan',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required for categorisation'],
      trim: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be low, medium, high, or urgent',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'completed', 'cancelled'],
        message: 'Status must be pending, in-progress, completed, or cancelled',
      },
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required for smart scheduling'],
    },
    estimatedMinutes: {
      type: Number,
      default: 30,
      min: [5, 'Task duration must be at least 5 minutes'],
      max: [1440, 'Task duration cannot exceed 24 hours (1440 mins)'],
    },
    actualMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Actual minutes cannot be negative'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
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

// Virtual property to dynamically compute overdue status
taskSchema.virtual('isOverdue').get(function () {
  if (this.isCompleted || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return this.dueDate ? new Date(this.dueDate) < new Date() : false;
});

// Automatically sync isCompleted and completedAt on save
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.isCompleted = true;
      if (!this.completedAt) this.completedAt = new Date();
    } else {
      this.isCompleted = false;
      this.completedAt = null;
    }
  }
  next();
});

// Compound indexes for optimal dashboard and filter queries
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, isCompleted: 1 });
taskSchema.index({ user: 1, subject: 1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

module.exports = Task;
