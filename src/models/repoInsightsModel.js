const { pool } = require('../config/database');

const RepoInsightsModel = {
  async upsert(profileId, insightsData) {
    const {
      total_stars, total_forks, total_watchers, total_open_issues,
      most_used_language, top_languages, top_repos, avg_repo_size,
      has_forked_repos, original_repo_count, forked_repo_count,
    } = insightsData;

    await pool.query(
      `INSERT INTO profile_repo_insights
        (profile_id, total_stars, total_forks, total_watchers, total_open_issues,
         most_used_language, top_languages, top_repos, avg_repo_size,
         has_forked_repos, original_repo_count, forked_repo_count, analyzed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         total_stars = VALUES(total_stars), total_forks = VALUES(total_forks),
         total_watchers = VALUES(total_watchers), total_open_issues = VALUES(total_open_issues),
         most_used_language = VALUES(most_used_language), top_languages = VALUES(top_languages),
         top_repos = VALUES(top_repos), avg_repo_size = VALUES(avg_repo_size),
         has_forked_repos = VALUES(has_forked_repos),
         original_repo_count = VALUES(original_repo_count),
         forked_repo_count = VALUES(forked_repo_count), analyzed_at = NOW()`,
      [
        profileId, total_stars, total_forks, total_watchers, total_open_issues,
        most_used_language, JSON.stringify(top_languages), JSON.stringify(top_repos),
        avg_repo_size, has_forked_repos ? 1 : 0, original_repo_count, forked_repo_count,
      ]
    );
  },
};

module.exports = RepoInsightsModel;
