const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const nodemailer = require('nodemailer');
 
// ── Brevo SMTP Transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
 
// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Brevo SMTP connection failed:', error.message);
  } else {
    console.log('✅ Brevo SMTP ready');
  }
});
 
// ── Helper: Send Admin Notification ────────────────────────────────────────
async function sendAdminEmail(data) {
  const { name, email, phone, instrument, level, message } = data;
 
  await transporter.sendMail({
    from: `"Rhythm Muse Land" <${process.env.BREVO_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '🎸 New Rhythm Muse Land Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Webinar Registration</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${name}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;">${phone || 'Not provided'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding: 8px; font-weight: bold;">Instrument</td><td style="padding: 8px;">${instrument}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Level</td><td style="padding: 8px;">${level}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding: 8px; font-weight: bold;">Goal</td><td style="padding: 8px;">${message || 'Not provided'}</td></tr>
        </table>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">Submitted from Rhythm Muse Land website.</p>
      </div>
    `
  });
}
 
// ── Helper: Send Confirmation to Registrant ─────────────────────────────────
async function sendConfirmationEmail(name, email) {
  await transporter.sendMail({
    from: `"Rhythm Muse Land" <${process.env.BREVO_USER}>`,
    to: email,
    subject: '🎸 Your Rhythm Muse Land Webinar Seat is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Rhythm Muse Land!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your registration has been successfully confirmed. We're excited to have you!</p>
 
        <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">📅 Webinar Details</h3>
          <p><strong>Day:</strong> Sunday</p>
          <p><strong>Time:</strong> 6:30 PM IST</p>
          <p><strong>Duration:</strong> 75 Minutes</p>
        </div>
 
        <div style="background: #2c3e50; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <h3 style="color: #fff; margin-top: 0;">🎥 Join the Webinar</h3>
          <a href="${process.env.ZOOM_LINK}"
             style="display: inline-block; background: #e74c3c; color: #fff; padding: 12px 32px;
                    border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Click Here to Join
          </a>
          <p style="color: #ccc; font-size: 12px; margin-top: 12px;">
            Please join 5 minutes before the session begins.
          </p>
        </div>
 
        <p>Looking forward to seeing you!</p>
        <p><strong>Dr. Landlin G. PhD</strong><br>Rhythm Muse Land</p>
 
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #aaa; font-size: 11px;">
          If you did not register for this webinar, please ignore this email.
        </p>
      </div>
    `
  });
}
 
// ── POST /api/register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, instrument, level, message } = req.body;
 
    // Validate required fields
    if (!name || !email || !instrument || !level) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.'
      });
    }
 
    // Check for duplicate registration
    const existing = await Registration.findOne({
      email: email.toLowerCase().trim()
    });
 
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Check your inbox for the Zoom link.'
      });
    }
 
    // Save to MongoDB
    const registration = new Registration({
      name,
      email: email.toLowerCase().trim(),
      phone,
      instrument,
      level,
      message
    });
 
    await registration.save();
 
    // ── Respond to user immediately after DB save ──
    res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for the Zoom link.',
      data: {
        name: registration.name,
        email: registration.email
      }
    });
 
    // ── Send emails in background (won't delay response) ──
    sendAdminEmail({ name, email, phone, instrument, level, message })
      .then(() => console.log(`✅ Admin notified for: ${email}`))
      .catch(err => console.error(`❌ Admin email failed for ${email}:`, err.message));
 
    sendConfirmationEmail(name, email)
      .then(() => console.log(`✅ Confirmation sent to: ${email}`))
      .catch(err => console.error(`❌ Confirmation email failed for ${email}:`, err.message));
 
  } catch (err) {
    console.error('Registration error:', err);
 
    // Avoid sending headers twice if already responded
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  }
});
 
// ── GET /api/registrations — Admin: list all ───────────────────────────────
router.get('/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
 
    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
 
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
 
module.exports = router;
 
