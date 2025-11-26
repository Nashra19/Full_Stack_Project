const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "/avatars/default.jpg" },
  phone: { type: String, default: "" },
  location: { type: String, default: "" },
  gender: { type: String, default: "" },
  dob: { type: Date, default: null },
  interests: { type: String, default: "" },

  // ✅ MODIFIED: Changed enum to DONOR and RECEIVER for clarity
  role: {
    type: String,
    enum: ['DONOR', 'RECEIVER'], // 'RECEIVER' is for NGOs/organizations
    required: true // Make role required at registration
  },
  organizationName: {
    type: String,
    default: ""
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFirstLogin: { type: Boolean, default: true },
  profileCompleted: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);