require('dotenv').config(); // Add this at the very top

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const requestLogger = require('./middlewares/logger');
const urlController = require('./controllers/urlController');

const app = express();
const PORT = process.env.PORT || 3001;

connectDB();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API routes (with /api prefix)
app.post('/api/shorturls', urlController.shortenURL);
app.get('/api/shorturls/:shortcode', urlController.getURLStats);

// Redirect route (no prefix - must be LAST)
app.get('/:shortcode', urlController.redirectToURL);

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});