const express = require('express');
const imagekit = require('../config/imagekit');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/auth', verifyToken, async (req, res) => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    res.json(authenticationParameters);
  } catch (error) {
    console.error('ImageKit auth error:', error);
    res.status(500).json({ message: 'Failed to generate authentication parameters' });
  }
});

module.exports = router;
