const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// The route /api/analytics/summary will trigger the getSummary function
router.get('/summary', analyticsController.getSummary);

module.exports = router;