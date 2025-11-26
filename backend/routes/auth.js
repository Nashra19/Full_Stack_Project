const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const router = express.Router();

// Register route (This is already correct)
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['DONOR', 'RECEIVER'].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, password: hashed, role });
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error, please try again" });
  }
});

// ✅ MODIFIED LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    // THE FIX: We are now including user.role in the response.
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // <-- THIS IS THE CRITICAL FIX
        avatar: user.avatar,
        bio: user.bio,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (err) {
    console.error("Login error:", err); 
    res.status(500).json({ error: "An internal server error occurred" });
  }
});


// (The rest of the file can remain the same)

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await User.findByIdAndUpdate(user._id, { otp: hashedOtp, otpExpiry });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Food Rescue Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Password Reset",
      html: `<p>Your OTP is: <b>${otp}</b>. It will expire in 10 minutes.</p>`,
    });
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ error: 'Email sending failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !user.otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  const isOtpValid = await bcrypt.compare(otp, user.otp);
  if (!isOtpValid) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate(
    { email }, 
    { password: hashed, otp: null, otpExpiry: null }
  );
  res.json({ message: 'Password reset successful' });
});

router.put("/profile/:id", async (req, res) => {
  try {
    const { name, bio, avatar, phone, location, gender, dob, interests } = req.body;
    const updatedFields = { name, bio, avatar, phone, location, gender, dob, interests, profileCompleted: true };
    const user = await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;

