const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const nodemailer = require('nodemailer');

// Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Brevo SMTP Error:', error);
  } else {
    console.log('Brevo SMTP Ready');
  }
});

// POST /api/register — submit webinar registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, instrument, level, message } = req.body;

    if (!name || !email || !instrument || !level) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.'
      });
    }

    // Save to MongoDB
    const registration = new Registration({
      name,
      email,
      phone,
      instrument,
      level,
      message
    });

    await registration.save();

    // Admin notification email
    try {
      await transporter.sendMail({
        from: 'Rhythm Muse Land <admin@lanmusic.in>',
        to: 'jenhil467@gmail.com',
        subject: '🎸 New Rhythm Muse Land Registration',
        html: `
          <h2>New Webinar Registration</h2>

          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Instrument:</strong> ${instrument}</p>
          <p><strong>Level:</strong> ${level}</p>
          <p><strong>Goal:</strong> ${message || 'Not provided'}</p>

          <hr>

          <p>Submitted from Rhythm Muse Land website.</p>
        `
      });

      console.log('Admin email sent');
    } catch (emailError) {
      console.error('Admin email failed:', emailError.message);
    }

    // Student confirmation email
    try {
      await transporter.sendMail({
        from: 'Rhythm Muse Land <admin@lanmusic.in>',
        to: email,
        subject: '🎸 Your Rhythm Muse Land Webinar Seat is Confirmed',
        html: `
          <h2>Welcome to Rhythm Muse Land!</h2>

          <p>Hi ${name},</p>

          <p>
            Your registration has been successfully confirmed.
          </p>

          <h3>📅 Webinar Details</h3>

          <p>
            Sunday<br>
            6:30 PM IST<br>
            Duration: 75 Minutes
          </p>

          <h3>🎥 Zoom Link</h3>

          <p>
            <a href="${process.env.ZOOM_LINK}">
              Join Webinar
            </a>
          </p>

          <p>
            Please join 5 minutes before the session begins.
          </p>

          <p>
            Looking forward to seeing you!
          </p>

          <p>
            Dr. Landlin G. PhD<br>
            Rhythm Muse Land
          </p>
        `
      });

      console.log('Student email sent');
    } catch (emailError) {
      console.error('Student email failed:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for webinar details.',
      data: {
        name: registration.name,
        email: registration.email
      }
    });

  } catch (err) {
    console.error('Registration error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// GET /api/registrations — admin: list all registrations
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
