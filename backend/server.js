// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
// Load env from project root (if present) then override with backend/.env
require("dotenv").config({ path: path.join(process.cwd(), ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");
const volunteerRoutes = require("./routes/volunteer");

const app = express();
app.use(cors());
// Increase body size limit to allow base64 images in donation payloads
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ✅ Connect to MongoDB
mongoose
  // ✅ FIX: Removed deprecated { useNewUrlParser, useUnifiedTopology } options.
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/volunteer", volunteerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));