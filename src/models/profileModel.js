const { pool } = require('../config/database');

const ProfileModel = {
  async upsert(profileData) {
    const {
      username, name, bio, avatar_url, profile_url, company, location,
      email, blog, twitter_username, public_repos, public_gists,
      followers, following, account_type, is_hireable,
      account_created_at, account_updated_at,
    } = profileData;

    const [result] = await pool.query(
      `INSERT INTO github_profiles 
        (username, name, bio, avatar_url, profile_url, company, location, email, blog,
         twitter_username, public_repos, public_gists, followers, following,
         account_type, is_hireable, account_created_at, account_updated_at, analyzed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), bio = VALUES(bio), avatar_url = VALUES(avatar_url),
         company = VALUES(company), location = VALUES(location), email = VALUES(email),
         blog = VALUES(blog), twitter_username = VALUES(twitter_username),
         public_repos = VALUES(public_repos), public_gists = VALUES(public_gists),
         followers = VALUES(followers), following = VALUES(following),
         account_type = VALUES(account_type), is_hireable = VALUES(is_hireable),
         account_updated_at = VALUES(account_updated_at), analyzed_at = NOW()`,
      [
        username, name, bio, avatar_url, profile_url, company, location,
        email, blog, twitter_username, public_repos, public_gists,
        followers, following, account_type, is_hireable ? 1 : 0,
        account_created_at, account_updated_at,
      ]
    );

    // Get the profile id (insertId or find existing)
    if (result.insertId) return result.insertId;

    const [rows] = await pool.query(
      'SELECT id FROM github_profiles WHERE username = ?', [username]
    );
    return rows[0].id;
  },

  async findAll({ page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit;
    const searchQuery = search ? `WHERE p.username LIKE ? OR p.name LIKE ?` : '';
    const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

    const [profiles] = await pool.query(
      `SELECT p.*, r.total_stars, r.total_forks, r.most_used_language, r.top_languages
       FROM github_profiles p
       LEFT JOIN profile_repo_insights r ON r.profile_id = p.id
       ${searchQuery}
       ORDER BY p.analyzed_at DESC
       LIMIT ? OFFSET ?`,
      [...searchParams, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM github_profiles p ${searchQuery}`,
      searchParams
    );

    return {
      profiles: profiles.map(p => ({
        ...p,
        top_languages: typeof p.top_languages === 'string'
          ? JSON.parse(p.top_languages) : p.top_languages,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT p.*, r.total_stars, r.total_forks, r.total_watchers, r.total_open_issues,
              r.most_used_language, r.top_languages, r.top_repos, r.avg_repo_size,
              r.has_forked_repos, r.original_repo_count, r.forked_repo_count
       FROM github_profiles p
       LEFT JOIN profile_repo_insights r ON r.profile_id = p.id
       WHERE p.username = ?`,
      [username]
    );

    if (!rows[0]) return null;

    const profile = rows[0];
    return {
      ...profile,
      top_languages: typeof profile.top_languages === 'string'
        ? JSON.parse(profile.top_languages) : profile.top_languages,
      top_repos: typeof profile.top_repos === 'string'
        ? JSON.parse(profile.top_repos) : profile.top_repos,
    };
  },

  async delete(username) {
    const [result] = await pool.query(
      'DELETE FROM github_profiles WHERE username = ?', [username]
    );
    return result.affectedRows > 0;
  },
};

module.exports = ProfileModel;
