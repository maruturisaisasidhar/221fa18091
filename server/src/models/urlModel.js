// server/src/models/urlModel.js
const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  referrer: String,
  location: String,
  ip: String
});

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  validityMinutes: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
  isCustom: { type: Boolean, default: false },
  clicks: [clickSchema]
});

// Generate unique shortcode
urlSchema.statics.generateUniqueShortcode = async function() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortcode;
  let exists = true;
  
  while (exists) {
    shortcode = '';
    for (let i = 0; i < 6; i++) {
      shortcode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existingUrl = await this.findOne({ shortCode: shortcode });
    exists = !!existingUrl;
  }
  return shortcode;
};

const URL = mongoose.model('URL', urlSchema);
module.exports = URL;