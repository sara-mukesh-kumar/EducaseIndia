const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'github_analyzer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    connection.release();
    return pool;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

const initializeDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS github_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(500),
        profile_url VARCHAR(500),
        company VARCHAR(255),
        location VARCHAR(255),
        email VARCHAR(255),
        blog VARCHAR(500),
        twitter_username VARCHAR(255),
        public_repos INT DEFAULT 0,
        public_gists INT DEFAULT 0,
        followers INT DEFAULT 0,
        following INT DEFAULT 0,
        account_type VARCHAR(50),
        is_hireable BOOLEAN DEFAULT FALSE,
        account_created_at DATETIME,
        account_updated_at DATETIME,
        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS profile_repo_insights (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_id INT NOT NULL,
        total_stars INT DEFAULT 0,
        total_forks INT DEFAULT 0,
        total_watchers INT DEFAULT 0,
        total_open_issues INT DEFAULT 0,
        most_used_language VARCHAR(100),
        top_languages JSON,
        top_repos JSON,
        avg_repo_size FLOAT DEFAULT 0,
        has_forked_repos BOOLEAN DEFAULT FALSE,
        original_repo_count INT DEFAULT 0,
        forked_repo_count INT DEFAULT 0,
        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES github_profiles(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analysis_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        ip_address VARCHAR(50),
        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = { pool, connectDB, initializeDB };
