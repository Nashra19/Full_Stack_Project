// ✅ FIX: Rewritten using CommonJS syntax (const/module.exports).
const nodemailer = require("nodemailer");

// Support both simple service config (e.g., gmail) and custom SMTP
const service = process.env.EMAIL_SERVICE || 'gmail';
const host = process.env.EMAIL_HOST || undefined;
const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : (port === 465);

const debugEnabled = process.env.EMAIL_DEBUG === 'true';

const transporter = nodemailer.createTransport({
  ...(host ? { host } : {}),
  ...(port ? { port } : {}),
  ...(typeof secure === 'boolean' ? { secure } : {}),
  // If host/port not provided, fall back to 'service'
  ...(host ? {} : { service }),
  ...(debugEnabled ? { logger: true, debug: true } : {}),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Optional transport verification for easier debugging
if (debugEnabled) {
  transporter.verify((err, success) => {
    if (err) {
      console.error('❌ SMTP verification failed:', err?.response || err?.message || err);
    } else {
      console.log('✅ SMTP transporter is ready to send mail.');
    }
  });
}

const sendEmail = async (to, subject, text, replyTo) => {
  try {
    const fromAddress = process.env.EMAIL_FROM || `Food Rescue Hub <${process.env.EMAIL_USER}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (process.env.NODE_ENV !== 'production' || debugEnabled) {
      console.log('📧 Email accepted by transporter:', info && info.messageId);
      console.log('   ↳ Accepted:', info && info.accepted);
      console.log('   ↳ Rejected:', info && info.rejected);
      console.log('   ↳ Response:', info && info.response);
    }
    return { ok: true, info };
  } catch (error) {
    console.error("❌ Email sending error:", error?.response || error?.message || error);
    return { ok: false, error };
  }
};

module.exports = { sendEmail, transporter, debugEnabled };