const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    instrument: {
      type: String,
      enum: ['guitar', 'bass', 'both'],
      required: [true, 'Instrument selection is required'],
    },
    level: {
      type: String,
      enum: ['complete-beginner', 'some-basics', 'intermediate', 'advanced'],
      required: [true, 'Level is required'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'enrolled'],
      default: 'registered',
    },
    source: {
      type: String,
      default: 'landing-page',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate email registrations
registrationSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
