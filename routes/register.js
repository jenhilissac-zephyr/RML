const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const nodemailer = require('nodemailer');

// Gmail transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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

   // Send notification email to admin
try {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
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
    `
  });

  console.log('Admin email sent');
} catch (emailError) {
  console.error('Admin email failed:', emailError.message);
}

 try {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🎸 Your Rhythm Muse Land Webinar Seat is Confirmed',
    html: `
      <h2>Welcome to Rhythm Muse Land!</h2>

      <p>Hi ${name},</p>

      <p>Your registration has been successfully confirmed.</p>

      <p>
        <a href="${process.env.ZOOM_LINK}">
          Join Webinar
        </a>
      </p>
    `
  });

  console.log('Student email sent');
} catch (emailError) {
  console.error('Student email failed:', emailError.message);
}

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You will receive details at your email.',
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
