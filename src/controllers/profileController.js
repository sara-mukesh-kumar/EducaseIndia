const { fetchUserProfile, fetchUserRepos, analyzeRepos } = require('../utils/githubHelper');
const ProfileModel = require('../models/profileModel');
const RepoInsightsModel = require('../models/repoInsightsModel');
const { pool } = require('../config/database');

// POST /api/profiles/analyze/:username
const analyzeProfile = async (req, res) => {
  const { username } = req.params;

  if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GitHub username format',
    });
  }

  try {
    // Log to history
    await pool.query(
      'INSERT INTO analysis_history (username, action, ip_address) VALUES (?, ?, ?)',
      [username, 'analyze', req.ip]
    );

    // Fetch from GitHub API
    const [ghProfile, ghRepos] = await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username),
    ]);

    // Map to our schema
    const profileData = {
      username: ghProfile.login,
      name: ghProfile.name,
      bio: ghProfile.bio,
      avatar_url: ghProfile.avatar_url,
      profile_url: ghProfile.html_url,
      company: ghProfile.company,
      location: ghProfile.location,
      email: ghProfile.email,
      blog: ghProfile.blog,
      twitter_username: ghProfile.twitter_username,
      public_repos: ghProfile.public_repos,
      public_gists: ghProfile.public_gists,
      followers: ghProfile.followers,
      following: ghProfile.following,
      account_type: ghProfile.type,
      is_hireable: ghProfile.hireable || false,
      account_created_at: new Date(ghProfile.created_at),
      account_updated_at: new Date(ghProfile.updated_at),
    };

    const repoInsights = analyzeRepos(ghRepos);

    // Save to DB
    const profileId = await ProfileModel.upsert(profileData);
    await RepoInsightsModel.upsert(profileId, repoInsights);

    // Fetch full saved record to return
    const saved = await ProfileModel.findByUsername(username);

    return res.status(200).json({
      success: true,
      message: `Profile for "${username}" analyzed and stored successfully`,
      data: saved,
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: `GitHub user "${username}" not found`,
      });
    }
    if (error.response?.status === 403) {
      return res.status(429).json({
        success: false,
        message: 'GitHub API rate limit exceeded. Add a GITHUB_TOKEN to increase limits.',
      });
    }
    console.error('analyzeProfile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/profiles
const getAllProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. page >= 1, 1 <= limit <= 100',
      });
    }

    const result = await ProfileModel.findAll({ page, limit, search });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('getAllProfiles error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/profiles/:username
const getProfileByUsername = async (req, res) => {
  const { username } = req.params;

  try {
    const profile = await ProfileModel.findByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile "${username}" not found. Use POST /api/profiles/analyze/${username} to analyze it first.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('getProfileByUsername error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /api/profiles/:username
const deleteProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const deleted = await ProfileModel.delete(username);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Profile "${username}" not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Profile "${username}" deleted successfully`,
    });
  } catch (error) {
    console.error('deleteProfile error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/profiles/stats/summary
const getStats = async (req, res) => {
  try {
    const [[summary]] = await pool.query(`
      SELECT 
        COUNT(*) as total_profiles,
        AVG(followers) as avg_followers,
        AVG(public_repos) as avg_repos,
        MAX(followers) as max_followers,
        SUM(public_repos) as total_repos_tracked
      FROM github_profiles
    `);

    const [topByFollowers] = await pool.query(
      `SELECT username, name, followers, public_repos, avatar_url
       FROM github_profiles ORDER BY followers DESC LIMIT 5`
    );

    const [topByStars] = await pool.query(
      `SELECT p.username, p.name, r.total_stars, r.most_used_language
       FROM github_profiles p
       JOIN profile_repo_insights r ON r.profile_id = p.id
       ORDER BY r.total_stars DESC LIMIT 5`
    );

    const [languageDist] = await pool.query(
      `SELECT most_used_language as language, COUNT(*) as count
       FROM profile_repo_insights
       WHERE most_used_language IS NOT NULL
       GROUP BY most_used_language ORDER BY count DESC LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_profiles: summary.total_profiles,
          avg_followers: parseFloat((summary.avg_followers || 0).toFixed(0)),
          avg_repos: parseFloat((summary.avg_repos || 0).toFixed(0)),
          max_followers: summary.max_followers || 0,
          total_repos_tracked: summary.total_repos_tracked || 0,
        },
        top_by_followers: topByFollowers,
        top_by_stars: topByStars,
        language_distribution: languageDist,
      },
    });
  } catch (error) {
    console.error('getStats error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
  getStats,
};
