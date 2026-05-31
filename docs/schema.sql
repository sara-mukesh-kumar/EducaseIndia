-- ============================================================
-- GitHub Profile Analyzer - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS github_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE github_analyzer;

-- ─── Table: github_profiles ─────────────────────────────────
CREATE TABLE IF NOT EXISTS github_profiles (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  username            VARCHAR(255) NOT NULL UNIQUE     COMMENT 'GitHub login username',
  name                VARCHAR(255)                     COMMENT 'Display name',
  bio                 TEXT                             COMMENT 'Profile bio',
  avatar_url          VARCHAR(500)                     COMMENT 'Avatar image URL',
  profile_url         VARCHAR(500)                     COMMENT 'GitHub profile URL',
  company             VARCHAR(255)                     COMMENT 'Company affiliation',
  location            VARCHAR(255)                     COMMENT 'Location string',
  email               VARCHAR(255)                     COMMENT 'Public email',
  blog                VARCHAR(500)                     COMMENT 'Blog / website URL',
  twitter_username    VARCHAR(255)                     COMMENT 'Twitter handle',
  public_repos        INT          DEFAULT 0           COMMENT 'Public repository count',
  public_gists        INT          DEFAULT 0           COMMENT 'Public gist count',
  followers           INT          DEFAULT 0           COMMENT 'Follower count',
  following           INT          DEFAULT 0           COMMENT 'Following count',
  account_type        VARCHAR(50)                      COMMENT 'User or Organization',
  is_hireable         BOOLEAN      DEFAULT FALSE       COMMENT 'Hireable flag',
  account_created_at  DATETIME                         COMMENT 'GitHub account creation date',
  account_updated_at  DATETIME                         COMMENT 'GitHub account last update',
  analyzed_at         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT 'Last analyzed timestamp',
  updated_at          DATETIME     DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username  (username),
  INDEX idx_followers (followers),
  INDEX idx_analyzed  (analyzed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── Table: profile_repo_insights ───────────────────────────
CREATE TABLE IF NOT EXISTS profile_repo_insights (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  profile_id          INT NOT NULL,
  total_stars         INT          DEFAULT 0           COMMENT 'Sum of stars across all repos',
  total_forks         INT          DEFAULT 0           COMMENT 'Sum of forks across all repos',
  total_watchers      INT          DEFAULT 0           COMMENT 'Sum of watchers',
  total_open_issues   INT          DEFAULT 0           COMMENT 'Sum of open issues',
  most_used_language  VARCHAR(100)                     COMMENT 'Most frequently used language',
  top_languages       JSON                             COMMENT 'Language -> repo count map',
  top_repos           JSON                             COMMENT 'Top 5 repos by stars',
  avg_repo_size       FLOAT        DEFAULT 0           COMMENT 'Average repo size in KB',
  has_forked_repos    BOOLEAN      DEFAULT FALSE       COMMENT 'Whether user has forked repos',
  original_repo_count INT          DEFAULT 0           COMMENT 'Count of original repos',
  forked_repo_count   INT          DEFAULT 0           COMMENT 'Count of forked repos',
  analyzed_at         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id)
    REFERENCES github_profiles(id)
    ON DELETE CASCADE,
  INDEX idx_profile   (profile_id),
  INDEX idx_stars     (total_stars)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── Table: analysis_history ────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_history (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(255) NOT NULL               COMMENT 'Analyzed username',
  action       VARCHAR(50)  NOT NULL               COMMENT 'Action type: analyze / delete',
  ip_address   VARCHAR(50)                         COMMENT 'Requester IP',
  analyzed_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_action   (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
