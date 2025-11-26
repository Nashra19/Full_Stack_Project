const express = require("express");
const { sendEmail } = require("../utils/email");

const router = express.Router();

// Public endpoint to receive volunteer submissions and email admin
router.post("/submit", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    const adminEmail = process.env.VOLUNTEER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) {
      return res.status(500).json({ error: "Admin email is not configured on the server" });
    }

    const subject = `New Volunteer Submission: ${name}`;
    const text = [
      `A new volunteer expressed interest:`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      ``,
      `Message:`,
      message,
    ].filter(Boolean).join("\n");

    const result = await sendEmail(adminEmail, subject, text, email);
    if (!result || !result.ok) {
      return res.status(502).json({ error: "Failed to send email. Please try again later.", to: adminEmail });
    }

    const info = result.info || {};
    return res.json({
      success: true,
      to: adminEmail,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      response: info.response || undefined,
      messageId: info.messageId || undefined,
    });
  } catch (err) {
    console.error("Volunteer submission error:", err);
    return res.status(500).json({ error: "Server error while submitting volunteer form" });
  }
});

module.exports = router;


