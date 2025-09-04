// server/src/controllers/urlController.js
const URL = require('../models/urlModel');
const logger = require('../config/logger');

exports.shortenURL = async (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;
    
    logger.info('URL shortening request', { url, shortcode, validity, ip: req.ip });

    if (!url) {
      return res.status(400).json({ error: 'URL is required', code: 'MISSING_URL' });
    }

    let validatedUrl = url.trim();
    if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
      validatedUrl = 'http://' + validatedUrl;
    }

    const validityMinutes = validity && validity > 0 ? Math.min(validity, 525600) : 30;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + validityMinutes);

    let finalShortcode;
    let isCustom = false;

    if (shortcode && shortcode.trim()) {
      const customCode = shortcode.trim();
      
      if (!/^[a-zA-Z0-9]{3,20}$/.test(customCode)) {
        return res.status(400).json({ 
          error: 'Custom shortcode must be 3-20 alphanumeric characters',
          code: 'INVALID_CUSTOM_SHORTCODE' 
        });
      }

      const reserved = ['api', 'admin', 'www', 'help', 'about'];
      if (reserved.includes(customCode.toLowerCase())) {
        return res.status(400).json({ 
          error: 'Shortcode is reserved',
          code: 'RESERVED_SHORTCODE' 
        });
      }

      const existingUrl = await URL.findOne({ shortCode: customCode });
      if (existingUrl) {
        return res.status(400).json({ 
          error: 'Shortcode already exists',
          code: 'SHORTCODE_EXISTS' 
        });
      }

      finalShortcode = customCode;
      isCustom = true;
    } else {
      finalShortcode = await URL.generateUniqueShortcode();
    }

    const newURL = new URL({
      originalUrl: validatedUrl,
      shortCode: finalShortcode,
      expiresAt,
      validityMinutes,
      isCustom
    });

    await newURL.save();

    logger.info('URL shortened successfully', { shortcode: finalShortcode, isCustom });

    res.status(201).json({
      shortcode: finalShortcode,
      shortUrl: `http://localhost:3001/${finalShortcode}`,
      originalUrl: validatedUrl,
      expiresAt,
      isCustom,
      validityMinutes
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Shortcode collision', code: 'DUPLICATE' });
    }
    logger.error('Error in shortenURL', { error: error.message });
    res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
};

exports.redirectToURL = async (req, res) => {
  try {
    const { shortcode } = req.params;
    
    logger.info('Redirect request', { shortcode, ip: req.ip });
    
    const url = await URL.findOne({ shortCode: shortcode });

    if (!url) {
      logger.warn('Shortcode not found', { shortcode });
      return res.status(404).json({ error: 'URL not found', code: 'URL_NOT_FOUND' });
    }

    if (new Date() > url.expiresAt) {
      logger.info('Expired URL accessed', { shortcode });
      return res.status(410).json({ error: 'URL has expired', code: 'URL_EXPIRED' });
    }

    const clickData = {
      timestamp: new Date(),
      referrer: req.get('Referer') || 'direct',
      ip: req.ip
    };
    
    url.clicks.push(clickData);
    await url.save();

    logger.info('Successful redirect', { shortcode, originalUrl: url.originalUrl });
    return res.redirect(302, url.originalUrl);
    
  } catch (error) {
    logger.error('Error in redirectToURL', { error: error.message });
    res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
};

exports.getURLStats = async (req, res) => {
  try {
    const { shortcode } = req.params;
    const url = await URL.findOne({ shortCode: shortcode });

    if (!url) {
      return res.status(404).json({ error: 'URL not found', code: 'URL_NOT_FOUND' });
    }

    res.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `http://localhost:3001/${url.shortCode}`,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      validityMinutes: url.validityMinutes,
      isActive: url.isActive && new Date() <= url.expiresAt,
      isCustom: url.isCustom,
      clickCount: url.clicks.length,
      clicks: url.clicks
    });
  } catch (error) {
    logger.error('Error in getURLStats', { error: error.message });
    res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
};
