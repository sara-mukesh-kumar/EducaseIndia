const express = require('express');
const router = express.Router();
const {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
  getStats,
} = require('../controllers/profileController');

/**
 * @route   GET /api/profiles/stats/summary
 * @desc    Get aggregate statistics of all analyzed profiles
 */
router.get('/stats/summary', getStats);

/**
 * @route   POST /api/profiles/analyze/:username
 * @desc    Fetch GitHub profile and store in DB (creates or refreshes)
 */
router.post('/analyze/:username', analyzeProfile);

/**
 * @route   GET /api/profiles
 * @desc    Get all stored profiles (paginated, searchable)
 * @query   page, limit, search
 */
router.get('/', getAllProfiles);

/**
 * @route   GET /api/profiles/:username
 * @desc    Get a single stored profile by username
 */
router.get('/:username', getProfileByUsername);

/**
 * @route   DELETE /api/profiles/:username
 * @desc    Delete a stored profile
 */
router.delete('/:username', deleteProfile);

module.exports = router;
