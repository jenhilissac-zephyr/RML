const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const axios = require('axios');

// ── Helper: Send Email via Brevo API ───────────────────────────────
async function sendEmail(to, subject, htmlContent) {
  return axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: 'Rhythm Muse Land',
        email: 'jenhil467@gmail.com'
      },
      to: [{ email: to }],
      subject,
      htmlContent
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
}

// ── Admin Notification ─────────────────────────────────────────────
async function sendAdminEmail(data) {
  const { name, email, phone, instrument, level, message } = data;

  await sendEmail(
    process.env.ADMIN_EMAIL,
    '🎸 New Rhythm Muse Land Registration',
    `
    <h2>New Webinar Registration</h2>

    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Instrument:</strong> ${instrument}</p>
    <p><strong>Level:</strong> ${level}</p>
    <p><strong>Goal:</strong> ${message || 'Not provided'}</p>
    `
  );
}

// ── Student Confirmation ───────────────────────────────────────────
async function sendConfirmationEmail(name, email) {
  await sendEmail(
    email,
    '🎸 Your Rhythm Muse Land Webinar Seat is Confirmed!',
    `
    <h2>Welcome to Rhythm Muse Land!</h2>

    <p>Hi <strong>${name}</strong>,</p>

    <p>Your registration has been successfully confirmed.</p>

    <h3>📅 Webinar Details</h3>

    <p>
      Sunday<br>
      6:30 PM IST<br>
      Duration: 75 Minutes
    </p>

    <h3>🎥 Join the Webinar</h3>

    <p>
      <a href="${process.env.ZOOM_LINK}">
        Click Here to Join
      </a>
    </p>

    <p>Please join 5 minutes before the session begins.</p>

    <p>
      Dr. Landlin G. PhD<br>
      Rhythm Muse Land
    </p>
    `
  );
}

// ── POST /api/register ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, instrument, level, message } = req.body;

    if (!name || !email || !instrument || !level) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.'
      });
    }

    // Allows multiple registrations from same email
    const registration = new Registration({
      name,
      email: email.toLowerCase().trim(),
      phone,
      instrument,
      level,
      message
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for webinar details.',
      data: {
        name: registration.name,
        email: registration.email
      }
    });

    // Background email sending
    sendAdminEmail({ name, email, phone, instrument, level, message })
      .then(() => console.log(`✅ Admin email sent: ${email}`))
      .catch(err => console.error('❌ Admin email failed:', err.response?.data || err.message));

    sendConfirmationEmail(name, email)
      .then(() => console.log(`✅ Confirmation sent: ${email}`))
      .catch(err => console.error('❌ Confirmation failed:', err.response?.data || err.message));

  } catch (err) {
    console.error('Registration error:', err);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  }
});

// ── GET /api/registrations ─────────────────────────────────────────
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
