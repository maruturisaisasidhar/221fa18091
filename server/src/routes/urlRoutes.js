const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');

// Only API routes here
router.post('/shorturls', urlController.shortenURL);
router.get('/shorturls/:shortcode', urlController.getURLStats);

module.exports = router;