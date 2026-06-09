require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', require('./routes/register'));

// Catch-all: serve index.html for single-page behaviour
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎸 Muse Land Rhythm Institute server running at http://localhost:${PORT}`);
});
